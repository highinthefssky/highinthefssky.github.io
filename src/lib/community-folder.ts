export interface CommunityPackage {
  id: string;
  name: string;
  folder: string;
  files: string[];
  notes?: string;
}

export interface CommunityIssue {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  affectedPackageIds: string[];
  filePaths?: string[];
  recommendation: string;
}

export interface CommunityScanReport {
  packageCount: number;
  fileCount: number;
  conflictCount: number;
  warningCount: number;
  packages: CommunityPackage[];
  issues: CommunityIssue[];
}

function normalizePath(value: string): string {
  return value.replaceAll('\\', '/').replaceAll('//', '/').replace(/^\/+/, '').trim();
}

function normalizeFolder(value: string): string {
  return normalizePath(value).replace(/\/+$/, '');
}

function hasNestedCommunityFolder(folder: string): boolean {
  return /(^|\/)community(\/|$)/i.test(folder) && /community.*community/i.test(folder);
}

function isSuspiciousFilePath(filePath: string): boolean {
  return /(^|\/)\.{2}(\/|$)/.test(filePath) || /(^|\/)temp(\/|$)/i.test(filePath) || /\.(zip|rar|7z)$/i.test(filePath);
}

export function buildCommunityScanReport(packages: CommunityPackage[]): CommunityScanReport {
  const normalizedPackages = packages.map((pkg) => ({
    ...pkg,
    folder: normalizeFolder(pkg.folder),
    files: pkg.files.map(normalizePath).filter(Boolean),
  }));

  const fileOwners = new Map<string, CommunityPackage[]>();
  const folderOwners = new Map<string, CommunityPackage[]>();
  const issues: CommunityIssue[] = [];
  let fileCount = 0;

  for (const pkg of normalizedPackages) {
    folderOwners.set(pkg.folder, [...(folderOwners.get(pkg.folder) ?? []), pkg]);

    if (hasNestedCommunityFolder(pkg.folder)) {
      issues.push({
        severity: 'warning',
        title: 'Nested Community folder detected',
        detail: `${pkg.name} lives inside another Community folder. That often means the package was extracted one level too deep.`,
        affectedPackageIds: [pkg.id],
        recommendation: 'Move the package so the mod folder sits directly inside Community.',
      });
    }

    for (const filePath of pkg.files) {
      fileCount += 1;

      if (isSuspiciousFilePath(filePath)) {
        issues.push({
          severity: 'warning',
          title: 'Suspicious file path',
          detail: `${pkg.name} contains a path that looks unusual for a Community package: ${filePath}.`,
          affectedPackageIds: [pkg.id],
          filePaths: [filePath],
          recommendation: 'Check whether this file came from a bad extraction, leftover archive, or test file.',
        });
      }

      const owners = fileOwners.get(filePath) ?? [];
      owners.push(pkg);
      fileOwners.set(filePath, owners);
    }
  }

  for (const [folder, owners] of folderOwners.entries()) {
    if (owners.length > 1) {
      issues.push({
        severity: 'warning',
        title: 'Duplicate package folder name',
        detail: `Multiple packages are using the same folder name: ${folder}. This can make it harder to tell them apart while troubleshooting.`,
        affectedPackageIds: owners.map((pkg) => pkg.id),
        recommendation: 'Rename one folder or temporarily move one package out of Community and retest.',
      });
    }
  }

  for (const [filePath, owners] of fileOwners.entries()) {
    if (owners.length <= 1) {
      continue;
    }

    const critical = /^(simobjects|html_ui|layout|effects|sound|airport|scenery)\//i.test(filePath);
    issues.push({
      severity: critical ? 'critical' : 'warning',
      title: critical ? 'Likely package conflict' : 'Shared file detected',
      detail: `The same file appears in multiple packages: ${filePath}. If this file belongs to a livery, aircraft, or UI mod, one package may be overriding another.`,
      affectedPackageIds: owners.map((pkg) => pkg.id),
      filePaths: [filePath],
      recommendation: critical
        ? 'Disable one of the conflicting packages and retest in the sim.'
        : 'Compare the packages and keep only the version you want enabled.',
    });
  }

  const conflictCount = issues.filter((issue) => issue.severity === 'critical').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;

  return {
    packageCount: normalizedPackages.length,
    fileCount,
    conflictCount,
    warningCount,
    packages: normalizedPackages,
    issues,
  };
}
