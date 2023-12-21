function saveFileAsPdf(fileName, content) {
    const blob = new Blob([content], { type: 'application/pdf' });

    // Create a URL for the blob.
    const url = URL.createObjectURL(blob);

    // Create a link with the URL as the `href` attribute.
    const link = document.createElement('a');
    link.href = url;

    // Set the filename of the PDF.
    link.download = fileName;

    // Programmatically click the link to trigger the download.
    document.body.appendChild(link);
    link.click();

    // Clean up by removing the link and revoking the URL.
    document.body.removeChild(link);
}