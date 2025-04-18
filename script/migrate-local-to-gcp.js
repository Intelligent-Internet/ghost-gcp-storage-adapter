const { Storage } = require('@google-cloud/storage');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// GCP Configuration
const config = {
    keyFilename: 'path/to/your/credentials.json',
    projectId: 'your-project-id',
    bucketName: 'your-bucket-name'
};

// Local content directories
const contentTypes = {
    images: 'content/images',
    media: 'content/media',
    files: 'content/files'
};

async function migrateFiles() {
    const storage = new Storage({
        keyFilename: config.keyFilename,
        projectId: config.projectId
    });
    const bucket = storage.bucket(config.bucketName);

    // Iterate through all content types
    for (const [type, contentPath] of Object.entries(contentTypes)) {
        console.log(`Starting migration of ${type}...`);

        // Get all files
        const files = glob.sync(`${contentPath}/**/*`, { nodir: true });

        for (const filePath of files) {
            try {
                // Calculate target path (remove content/ prefix)
                const targetPath = filePath.replace(/^content\/(images|media|files)\//, '');

                console.log(`Migrating: ${filePath} -> ${targetPath}`);

                // Upload file to GCP
                await bucket.upload(filePath, {
                    destination: targetPath,
                    // Set file as publicly accessible
                    public: true,
                    // Set cache control
                    metadata: {
                        cacheControl: 'public, max-age=31536000'
                    }
                });

                console.log(`✓ Success: ${targetPath}`);
            } catch (err) {
                console.error(`✗ Failed: ${filePath}`, err);
            }
        }
    }
}

// Run migration
migrateFiles().catch(console.error);