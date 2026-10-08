import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileSpreadsheet, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useAccessStore } from '@/access/accessStore';
import type { User, Role, UserStatus } from '@/types';
import { generateId } from '@/utils/id';
import { nowISO } from '@/utils/date';
import { parseSpreadsheetFile, downloadExcelFile, createColumnResolver } from '@/utils/spreadsheet';

interface StaffBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RowError {
  rowNumber: number;
  data: string;
  reason: string;
}

const ALLOWED_BULK_ROLES: Role[] = ['librarian', 'staff', 'principal'];

export function StaffBulkImportModal({ isOpen, onClose }: StaffBulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState<{ imported: number; failed: number } | null>(null);
  const [errorsList, setErrorsList] = useState<RowError[]>([]);

  const users = useAccessStore((s) => s.users);
  const addUsers = useAccessStore((s) => s.addUsers);

  const sampleRows = [
    {
      name: 'Dr. Manas Ranjan Hota',
      role: 'librarian',
      username: 'manas_lib',
      password: 'Lib@2026',
      email: 'manas.h@pscollege.ac.in',
      phone: '9437112233',
      status: 'Active',
    },
    {
      name: 'Pravat Kumar Jena',
      role: 'staff',
      username: 'pravat_staff',
      password: 'Staff@2026',
      email: 'pravat.j@pscollege.ac.in',
      phone: '9861223344',
      status: 'Active',
    },
    {
      name: 'Dr. Sanjukta Dash',
      role: 'principal',
      username: 'sanjukta_prin',
      password: 'Prin@2026',
      email: 'sanjukta.d@pscollege.ac.in',
      phone: '9438334455',
      status: 'Active',
    },
  ];

  function handleDownloadTemplateCsv() {
    const headers = ['Name', 'Role', 'Username', 'Password', 'Email', 'Phone', 'Status'];
    const rows = [
      'Dr. Manas Ranjan Hota,librarian,manas_lib,Lib@2026,manas.h@pscollege.ac.in,9437112233,Active',
      'Pravat Kumar Jena,staff,pravat_staff,Staff@2026,pravat.j@pscollege.ac.in,9861223344,Active',
      'Dr. Sanjukta Dash,principal,sanjukta_prin,Prin@2026,sanjukta.d@pscollege.ac.in,9438334455,Active',
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ps_college_staff_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleDownloadTemplateExcel() {
    downloadExcelFile(
      'ps_college_staff_template',
      ['Name', 'Role', 'Username', 'Password', 'Email', 'Phone', 'Status'],
      sampleRows.map((r) => [r.name, r.role, r.username, r.password, r.email, r.phone, r.status]),
    );
  }

  function handleDownloadErrorReport() {
    if (errorsList.length === 0) return;
    downloadExcelFile(
      'staff_import_error_report',
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
      toast.error('The selected file has no data rows.');
      setIsProcessing(false);
      return;
    }

    const resolveCol = createColumnResolver(headers);
    const colName = resolveCol(['name', 'fullname', 'staffname'], 0);
    const colRole = resolveCol(['role', 'designation'], 1);
    const colUsername = resolveCol(['username', 'user'], 2);
    const colPassword = resolveCol(['password', 'pass'], 3);
    const colEmail = resolveCol(['email', 'emailid', 'mail'], 4);
    const colPhone = resolveCol(['phone', 'phoneno', 'mobile', 'contact'], 5);
    const colStatus = resolveCol(['status'], 6);

    const newErrors: RowError[] = [];
    const validUsersToAdd: User[] = [];

    const existingUsernames = new Set(users.map((u) => u.username.trim().toLowerCase()));
    const batchUsernames = new Set<string>();

    rows.forEach((cells, idx) => {
      const rowNum = idx + 2; // header offset
      const rowSummary = cells.join(', ');

      const name = cells[colName]?.trim() || '';
      const rawRole = cells[colRole]?.trim() || '';
      const roleStr = rawRole.toLowerCase();
      const username = cells[colUsername]?.trim() || '';
      const password = cells[colPassword]?.trim() || '';
      const email = cells[colEmail]?.trim() || '';
      const phone = cells[colPhone]?.trim() || '';
      const statusStr = cells[colStatus]?.trim().toLowerCase() || 'active';

      // Validation 1: Name
      if (!name || name.length < 2) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: 'Full name must be at least 2 characters.' });
        return;
      }

      // Validation 2: Role
      if (!roleStr) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: 'Missing required field: Role.' });
        return;
      }

      if (roleStr === 'admin') {
        newErrors.push({
          rowNumber: rowNum,
          data: rowSummary,
          reason: "Role 'Admin' cannot be bulk uploaded. Only 1 Administrator is permitted in the system.",
        });
        return;
      }

      const matchedRole = ALLOWED_BULK_ROLES.find((r) => r === roleStr);
      if (!matchedRole) {
        newErrors.push({
          rowNumber: rowNum,
          data: rowSummary,
          reason: `Invalid Role: "${rawRole}". Must be one of: librarian, staff, or principal.`,
        });
        return;
      }

      // Validation 3: Username
      if (!username) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: 'Missing required field: Username.' });
        return;
      }
      if (username.length < 3 || username.length > 30) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: 'Username must be between 3 and 30 characters.' });
        return;
      }
      if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        newErrors.push({
          rowNumber: rowNum,
          data: rowSummary,
          reason: 'Username can only contain letters, numbers, dots, hyphens, and underscores.',
        });
        return;
      }

      const lowerUsername = username.toLowerCase();
      if (existingUsernames.has(lowerUsername) || batchUsernames.has(lowerUsername)) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: `Username "@${username}" is already taken.` });
        return;
      }

      // Validation 4: Password
      let finalPassword = password;
      if (!finalPassword) {
        finalPassword = `${username}@2026`;
      } else if (finalPassword.length < 6) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: 'Password must be at least 6 characters.' });
        return;
      }

      // Validation 5: Email format
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: `Invalid email address: "${email}".` });
        return;
      }

      // Validation 6: Phone
      const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
      if (phone && cleanPhone.length !== 10) {
        newErrors.push({ rowNumber: rowNum, data: rowSummary, reason: `Invalid phone: "${phone}". Must be a 10-digit number.` });
        return;
      }

      // Validation 7: Status
      const status: UserStatus = statusStr === 'suspended' ? 'suspended' : 'active';

      batchUsernames.add(lowerUsername);

      const newUser: User = {
        id: generateId(`user_${matchedRole}`),
        username,
        password: finalPassword,
        name,
        role: matchedRole,
        status,
        email: email || undefined,
        phone: cleanPhone || undefined,
        createdAt: nowISO(),
      };

      validUsersToAdd.push(newUser);
    });

    if (validUsersToAdd.length > 0) {
      addUsers(validUsersToAdd);
    }

    setImportStats({
      imported: validUsersToAdd.length,
      failed: newErrors.length,
    });
    setErrorsList(newErrors);
    setIsProcessing(false);

    if (validUsersToAdd.length > 0 && newErrors.length === 0) {
      toast.success(`Successfully uploaded and created all ${validUsersToAdd.length} staff accounts!`);
    } else if (validUsersToAdd.length > 0) {
      toast.success(`Imported ${validUsersToAdd.length} users. ${newErrors.length} row(s) had errors.`);
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
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Excel (Staff & Librarians)" size="lg">
      <div className="space-y-5">
        <p className="text-sm text-secondary-600">
          Upload staff, librarian, or principal credentials in bulk using an Excel spreadsheet. Valid accounts will be created and activated immediately.
        </p>

        {/* Step 1: Download Templates */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-secondary-200 bg-secondary-50 p-4">
          <div>
            <h4 className="text-sm font-medium text-secondary-900">Need the template format?</h4>
            <p className="text-xs text-secondary-500">
              Download the template with sample rows for Librarians, Staff, and Principals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplateExcel}>
              <FileSpreadsheet className="size-4" /> Excel (.xls)
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplateCsv}>
              <Download className="size-4" /> CSV
            </Button>
          </div>
        </div>

        {/* Step 2: Upload Zone */}
        {!importStats && (
          <div className="rounded-lg border-2 border-dashed border-secondary-200 p-6 text-center hover:border-primary-400">
            <input
              type="file"
              id="staff-bulk-import-file"
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
            <label htmlFor="staff-bulk-import-file" className="flex cursor-pointer flex-col items-center gap-2">
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
                  <div className="text-xs text-success-700">Accounts Successfully Created</div>
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

