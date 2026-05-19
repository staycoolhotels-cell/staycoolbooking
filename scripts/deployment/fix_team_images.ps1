Add-Type -AssemblyName System.Drawing

$srcDir = 'C:\Users\VSHARE\.gemini\antigravity\brain\9139e08b-31e7-439e-91e2-fe41ce4c308a'
$destDir = 'E:\staycoolbooking1\public\assets\images'

$pairs = @(
    @{ src = 'media__1774373188400.jpg'; dest = 'team-member-2.jpg' },
    @{ src = 'media__1774373193326.jpg'; dest = 'team-member-1.jpg' }
)

foreach ($pair in $pairs) {
    $inPath  = Join-Path $srcDir  $pair.src
    $tmpPath = Join-Path $destDir ("tmp-" + $pair.dest)
    $outPath = Join-Path $destDir $pair.dest

    Write-Host "Processing $($pair.src) -> $($pair.dest)"
    $img = [System.Drawing.Image]::FromFile($inPath)
    $origW = $img.Width; $origH = $img.Height
    Write-Host "  Original: $origW x $origH"

    # Resize to max 1000px wide - bigger = less compression needed
    $newW = [Math]::Min($origW, 1000)
    $newH = [int]($origH * $newW / $origW)
    Write-Host "  Target:   $newW x $newH"

    $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $newW, $newH)
    $img.Dispose()

    # Paint over watermark top-right ~20% width, top ~6% height
    $wmX = [int]($newW * 0.80)
    $wmHt = [int]($newH * 0.065)
    $brush = [System.Drawing.Brushes]::Black
    $g.FillRectangle($brush, $wmX, 0, ($newW - $wmX), $wmHt)
    $g.Dispose()
    Write-Host "  Watermark painted: x=$wmX..$newW, y=0..$wmHt"

    # Save at quality 96 - much higher = no grain
    $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep  = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 96L)
    $bmp.Save($tmpPath, $enc, $ep)
    $bmp.Dispose()

    if (Test-Path $outPath) { Remove-Item $outPath -Force }
    Rename-Item $tmpPath $outPath
    $size = [Math]::Round((Get-Item $outPath).Length / 1KB, 1)
    Write-Host "  Saved $outPath ($size KB)"
}

Write-Host "ALL DONE"
