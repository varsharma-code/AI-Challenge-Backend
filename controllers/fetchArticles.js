// services/fileService.js (or utils/fileReader.js if it's purely a utility)

import fs from 'fs/promises'; // Use 'import' for ES Modules
import path from 'path';

/**
 * Reads the content of specified article files from a directory.
 * Filters files starting with 'Article' and returns their full content.
 *
 * @param {string} articlesDirectoryPath - The path to the directory containing article files.
 * @returns {Promise<string[]>} - A promise that resolves to an array of strings,
 * each string being the full content of an article file.
 * Returns an empty array if no files are found or if errors occur during reading.
 */
export async function readArticleFiles(articlesDirectoryPath) {
    const articleContents = []; // Changed to store just contents

    try {
        const fileNames = await fs.readdir(articlesDirectoryPath);

        // Filter for files that are likely your articles, starting with 'Article'
        const articleFiles = fileNames.filter(name => name.startsWith('Article'));

        if (articleFiles.length === 0) {
            console.warn(`No article files found in directory: ${articlesDirectoryPath}. Please ensure they are named 'ArticleX' (e.g., Article1.txt).`);
            return [];
        }

        for (const fileName of articleFiles) {
            const filePath = path.join(articlesDirectoryPath, fileName);
            console.log(`Reading file: ${filePath}`);

            try {
                const content = await fs.readFile(filePath, 'utf8');
                articleContents.push(content); // Push content directly
            } catch (fileReadError) {
                console.error(`Error reading file ${fileName}:`, fileReadError.message);
                // Continue to the next file even if one fails
            }
        }
    } catch (dirReadError) {
        console.error(`Error reading directory ${articlesDirectoryPath}:`, dirReadError.message);
        return []; // Return empty array if directory reading fails
    }

    return articleContents;
}

// --- Dummy Call Example ---
// This immediately invoked async function demonstrates how to use readArticleFiles.
// It's placed here for demonstration purposes. In a real application,
// you'd call readArticleFiles from your main application logic or a controller.
// (async () => {
//     // Adjust path as needed for your project structure.
//     // Assuming 'ArticlesDump' is a sibling directory to 'services' or 'controllers'.
//     const dirPath = path.join(process.cwd(), 'ArticlesDump'); // Using process.cwd() for a more robust path

//     console.log("Articles Directory Path for dummy call:", dirPath);

//     try {
//         const articles = await readArticleFiles(dirPath);
//         console.log("\n--- Dummy Call Results ---");
//         if (articles.length > 0) {
//             console.log(`Successfully read ${articles.length} articles.`);
//             console.log("ARTICLES"+articles)
//             // You can log the content of the first article for verification
//             // console.log("Content of first article:", articles[0].substring(0, 200) + "..."); // Log first 200 chars
//         } else {
//             console.log("No articles found or read during dummy call.");
//         }
//         console.log("--- End Dummy Call Results ---\n");
//     } catch (error) {
//         console.error("Error during dummy call:", error.message);
//     }
// })();