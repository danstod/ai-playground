import "dotenv/config";
import D from "dropbox";
import * as fs from "node:fs";
import fetch from "isomorphic-fetch"; // Required for environments that don't have fetch

const dbx = new D.Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
  fetch: fetch,
});

export const getFilesFromDropbox = async ({ folderName }) => {
  const res = await dbx.filesListFolder({ path: folderName }); // Empty string refers to the root folder
  if (res.result.entries.length === 0) {
    console.log("*** No files found in the root folder ***");
  } else {
    console.log(`${res.result.entries.length} files retrieved from Dropbox`);
  }
  // res.result.entries.forEach((file) => {
  //   console.log(file.name);
  // });

  return res.result.entries;
};

export const downloadFileFromDropbox = async (dropboxFile) => {
  const fileResponse = await dbx.filesDownload({
    path: dropboxFile.path_lower,
    rev: dropboxFile.rev,
  });

  const data = Buffer.from(fileResponse.result.fileBinary, "binary");
  const localPath = `./${fileResponse.result.name}`;
  fs.writeFileSync(localPath, data);
  console.log(
    `Downloaded: ${fileResponse.result.name}, localPath: ${localPath} `,
  );
  return localPath;
};

export function fileToArrayBuffer(filePath) {
  // Read the file as a Node.js Buffer
  const buffer = fs.readFileSync(filePath);

  // Convert the Buffer to an ArrayBuffer
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );

  return arrayBuffer;
}
