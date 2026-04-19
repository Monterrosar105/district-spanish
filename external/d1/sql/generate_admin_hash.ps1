param(
    [Parameter(Mandatory = $false)]
    [string]$Password,

    [Parameter(Mandatory = $false)]
    [int]$Iterations = 210000,

    [Parameter(Mandatory = $false)]
    [int]$SaltLength = 16
)

if ([string]::IsNullOrWhiteSpace($Password)) {
    $secure = Read-Host -Prompt "Enter admin password" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

if ($SaltLength -lt 8) {
    throw "SaltLength must be at least 8."
}

$salt = [guid]::NewGuid().ToString("N").Substring(0, $SaltLength)
$kdf = [System.Security.Cryptography.Rfc2898DeriveBytes]::new(
    $Password,
    [Text.Encoding]::UTF8.GetBytes($salt),
    $Iterations,
    [System.Security.Cryptography.HashAlgorithmName]::SHA256
)

try {
    $hashBytes = $kdf.GetBytes(32)
    $hashHex = [Convert]::ToHexString($hashBytes).ToLower()
    $formatted = "pbkdf2$Iterations`$$salt`$$hashHex"

    Write-Host ""
    Write-Host "Use this value in external/d1/sql/seed_admin.sql:" -ForegroundColor Cyan
    Write-Host $formatted -ForegroundColor Green
    Write-Host ""

    $copy = Read-Host -Prompt "Copy to clipboard? (y/n)"
    if ($copy -match '^(y|yes)$') {
        Set-Clipboard -Value $formatted
        Write-Host "Copied to clipboard." -ForegroundColor Yellow
    }
} finally {
    $kdf.Dispose()
}
