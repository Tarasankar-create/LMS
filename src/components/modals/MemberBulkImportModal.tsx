import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileSpreadsheet, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { parseSpreadsheetFile, downloadExcelFile, createColumnResolver } from '@/utils/spreadsheet';
import { useMembersStore } from '@/store/membersStore';
import { useAccessStore } from '@/access/accessStore';
import { DEPARTMENTS } from '@/constants/departments';
import type { Member, MemberStatus } from '@/types';
import { generateId } from '@/utils/id';
import { todayISO } from '@/utils/date';

interface MemberBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RowError {
  rowNumber: number;
  data: string;
  reason: string;
}

export function MemberBulkImportModal({ isOpen, onClose }: MemberBulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState<{ imported: number; failed: number } | null>(null);
  const [errorsList, setErrorsList] = useState<RowError[]>([]);

  const members = useMembersStore((s) => s.members);
  const addMembers = useMembersStore((s) => s.addMembers);

  function handleDownloadTemplate() {
    downloadExcelFile(
      'ps_college_students_template',
      ['Name', 'RollNumber', 'Department', 'Email', 'Phone', 'Status'],
      [
        ['Ananya Mohapatra', '2026201', 'Science', 'ananya.m@pscollege.ac.in', '9437111001', 'Active'],
        ['Subrat Panda', '2026202', 'Commerce', 'subrat.p@pscollege.ac.in', '9437111002', 'Active'],
        ['Sunita Behera', '2026203', 'Arts', 'sunita.b@pscollege.ac.in', '9437111003', 'Active'],
      ],
    );
  }

  function handleDownloadErrorReport() {
    if (errorsList.length === 0) return;
    downloadExcelFile(
      'student_import_error_report',
      ['RowNumber', 'FailedData', 'Reason'],
      errorsList.map((err) => [err.rowNumber, err.data, err.reason]),
    );
  }

  async function handleProcessImport() {
    if (!file) {
      toast.error('Please choose an Excel file first.');
      return;
    }

    setIsProcessing(true);
    let parsed;
    try {
      parsed = await parseSpreadsheetFile(file);
    } catch {
      toast.error('Could not read the spreadsheet file. Please ensure it is a valid Excel or CSV file.');
      setIsProcessing(false);
      return;
    }

    const { headers, rows } = parsed;
    if (rows.length === 0) {
      toast.error('The selected file has no student data rows.');
      setIsProcessing(false);
      return;
    }

    const resolveCol = createColumnResolver(headers);
    const colName = resolveCol(['name', 'fullname', 'studentname'], 0);
    const colRoll = resolveCol(['rollnumber', 'rollno', 'roll'], 1);
    const colDept = resolveCol(['department', 'dept', 'stream'], 2);
    const colEmail = resolveCol(['email', 'emailid', 'mail'], 3);
    const colPhone = resolveCol(['phone', 'phoneno', 'mobile', 'contact'], 4);
    const colStatus = resolveCol(['status'], 5);

    const newErrors: RowError[] = [];
    const validMembersToAdd: Member[] = [];
    const existingRolls = new Set(members.map((m) => m.rollNumber.trim().toUpperCase()));
    const batchRolls = new Set<string>();

    let nextNumber = members.length + 1001;

    rows.forEach((cells, idx) => {
      const rowNum = idx + 2; // header offset
      const rowSummary = cells.join(', ');

      const name = cells[colName]?.trim() || '';
      const rollNumber = cells[colRoll]?.trim() || '';
      const rawDeptVal = cells[colDept]?.trim() || '';
      const email = cells[colEmail]?.trim() || '';
      const phone = cells[colPhone]?.trim() || '';
      const rawStatusVal = cells[colStatus]?.trim() || 'Active';

      // Validation
      if (!name) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: 'Missing required field: Name' });
        return;
      }
      if (!rollNumber) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: 'Missing required field: RollNumber' });
        return;
      }
      const upperRoll = rollNumber.toUpperCase();
      if (existingRolls.has(upperRoll) || batchRolls.has(upperRoll)) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: `Duplicate Roll Number: ${rollNumber}` });
        return;
      }

      if (!rawDeptVal) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: 'Missing required field: Department' });
        return;
      }

      // Check department against allowed departments
      const matchedDept = DEPARTMENTS.find((d) => d.toLowerCase() === rawDeptVal.toLowerCase());
      if (!matchedDept) {
        newErrors.push({
          rowNumber: rowNum,
          data: rowSummary,
          reason: `Invalid Department: "${rawDeptVal}". Must be one of: ${DEPARTMENTS.join(', ')}`,
        });
        return;
      }

      // Validate phone if provided
      const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
      if (cleanPhone && cleanPhone.length !== 10) {
        newErrors.push({
          rowNumber: rowNum,
          data: rowSummary,
          reason: `Invalid Phone: "${phone}". Must be a 10-digit mobile number.`,
        });
        return;
      }

      // Validate email format if provided
      if (email && !/^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        newErrors.push({
          rowNumber: rowNum,
          data: rowSummary,
          reason: `Invalid Email address: "${email}".`,
        });
        return;
      }

      let status: MemberStatus = 'Active';
      if (['Active', 'Inactive', 'Suspended'].includes(rawStatusVal)) {
        status = rawStatusVal as MemberStatus;
      }

      batchRolls.add(upperRoll);

      const member: Member = {
        id: generateId('member'),
        memberId: `MEM-${nextNumber}`,
        name,
        rollNumber,
        department: matchedDept,
        email: email || `${rollNumber}@pscollege.ac.in`,
        phone: cleanPhone || '9437000000',
        status,
        joinDate: todayISO(),
      };
      nextNumber += 1;
      validMembersToAdd.push(member);
    });

    if (validMembersToAdd.length > 0) {
      addMembers(validMembersToAdd);
      const accessStore = useAccessStore.getState();
      validMembersToAdd.forEach((m) => {
        accessStore.ensureStudentUserForMember(m);
      });
    }

    setImportStats({
      imported: validMembersToAdd.length,
      failed: newErrors.length,
    });
    setErrorsList(newErrors);
    setIsProcessing(false);

    if (validMembersToAdd.length > 0 && newErrors.length === 0) {
      toast.success(`Successfully imported all ${validMembersToAdd.length} students!`);
    } else if (validMembersToAdd.length > 0) {
      toast.success(`Imported ${validMembersToAdd.length} students. ${newErrors.length} row(s) had errors.`);
    } else {
      toast.error(`All ${newErrors.length} rows failed validation. Download error report for details.`);
    }
  }

  function handleReset() {
    setFile(null);
    setImportStats(null);
    setErrorsList([]);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Excel (Students)" size="lg">
      <div className="space-y-5">
        <p className="text-sm text-secondary-600">
          Upload a student roster spreadsheet in Excel format. Valid student records will be registered immediately with
          their department, roll number, and credentials.
        </p>

        {/* Step 1: Download Template */}
        <div className="flex items-center justify-between rounded-lg border border-secondary-200 bg-secondary-50 p-4">
          <div>
            <h4 className="text-sm font-medium text-secondary-900">Need the template format?</h4>
            <p className="text-xs text-secondary-500">
              Download the template with pre-filled sample rows for Science, Commerce, and Arts departments.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="size-4" /> Download Template
          </Button>
        </div>

        {/* Step 2: Upload Zone */}
        {!importStats && (
          <div className="rounded-lg border-2 border-dashed border-secondary-200 p-6 text-center hover:border-primary-400">
            <input
              type="file"
              id="student-import-file"
              accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) {
                  setFile(selected);
                  setErrorsList([]);
                }
              }}
            />
            <label htmlFor="student-import-file" className="flex cursor-pointer flex-col items-center gap-2">
              <FileSpreadsheet className="size-10 text-secondary-400" />
              <span className="text-sm font-medium text-secondary-700">
                {file ? file.name : 'Click to select Excel file'}
              </span>
              <span className="text-xs text-secondary-400">Accepts Excel spreadsheet (.xlsx, .xls, .csv) files</span>
            </label>
          </div>
        )}

        {/* Selected file state */}
        {file && !importStats && (
          <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm">
            <div className="flex items-center gap-2 text-primary-900">
              <FileSpreadsheet className="size-5 text-primary-600" />
              <span className="font-medium">{file.name}</span>
              <span className="text-xs text-primary-600">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs font-medium text-danger-600 hover:text-danger-800 hover:underline"
            >
              Remove
            </button>
          </div>
        )}

        {/* Step 3: Results Summary */}
        {importStats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-success-200 bg-success-50 p-4">
                <CheckCircle2 className="size-8 text-success-600" />
                <div>
                  <div className="text-2xl font-bold text-success-900">{importStats.imported}</div>
                  <div className="text-xs text-success-700">Students Successfully Added</div>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 rounded-lg border p-4 ${
                  importStats.failed > 0 ? 'border-danger-200 bg-danger-50' : 'border-secondary-200 bg-secondary-50'
                }`}
              >
                <AlertCircle
                  className={`size-8 ${importStats.failed > 0 ? 'text-danger-600' : 'text-secondary-400'}`}
                />
                <div>
                  <div
                    className={`text-2xl font-bold ${
                      importStats.failed > 0 ? 'text-danger-900' : 'text-secondary-700'
                    }`}
                  >
                    {importStats.failed}
                  </div>
                  <div
                    className={`text-xs ${importStats.failed > 0 ? 'text-danger-700' : 'text-secondary-500'}`}
                  >
                    Rows Failed Validation
                  </div>
                </div>
              </div>
            </div>

            {/* Error List Preview */}
            {errorsList.length > 0 && (
              <div className="rounded-lg border border-danger-200 bg-danger-50/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-danger-900">
                    Failed Rows Breakdown ({errorsList.length})
                  </h4>
                  <Button variant="outline" size="sm" onClick={handleDownloadErrorReport}>
                    <Download className="size-3.5" /> Download Error Report
                  </Button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
                  {errorsList.slice(0, 10).map((err, i) => (
                    <div key={i} className="rounded border border-danger-200 bg-white p-2">
                      <div className="font-semibold text-danger-700">
                        Row {err.rowNumber}: {err.reason}
                      </div>
                      <div className="truncate text-secondary-500 font-mono text-[10px] mt-0.5">{err.data}</div>
                    </div>
                  ))}
                  {errorsList.length > 10 && (
                    <div className="text-center text-xs text-secondary-500 pt-1">
                      ...and {errorsList.length - 10} more errors. Download full report to view all.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 border-t border-secondary-100 pt-4">
          <Button variant="outline" onClick={onClose}>
            {importStats ? 'Close' : 'Cancel'}
          </Button>
          {importStats ? (
            <Button onClick={handleReset}>Upload Another File</Button>
          ) : (
            <Button disabled={!file || isProcessing} isLoading={isProcessing} onClick={handleProcessImport}>
              <Upload className="size-4" /> Upload Excel
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
