import { promises as fs } from "fs";
import * as path from "path";
import { exec } from "child_process";

interface PackageJson {
  version?: string;
  bumpie?: { [path: string]: [string, string] };
}

const PACKAGE_JSON_PATH = path.join(process.cwd(), "package.json");

const bumpToVersion = (version: string) => async ([
  filepath,
  [regex, pattern],
]: [string, [string, string]]) => {
  try {
    const relativePath = path.join(process.cwd(), filepath);

    let data = await fs.readFile(relativePath, "utf8");

    data = data.replace(
      new RegExp(regex, "g"),
      pattern.replace("<version>", version)
    );

    await fs.writeFile(relativePath, data, "utf8");
  } catch (error) {
    return Promise.reject(error);
  }
};

const stageFile = (filepath: string) =>
  new Promise((resolve, reject) => {
    exec(`git add ${path.join(process.cwd(), filepath)}`, (error) => {
      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });

export const run = async () => {
  try {
    const pkg: PackageJson = await import(PACKAGE_JSON_PATH);

    const { version, bumpie } = pkg;

    if (!version) {
      return Promise.reject('package.json "version" property is missing.');
    }

    if (!bumpie) {
      return Promise.reject('package.json "bumpie" property is missing.');
    }

    const tuples = Object.entries(bumpie);

    const bumpAssetVersion = bumpToVersion(version);

    await Promise.all(tuples.map(bumpAssetVersion));

    await Promise.all(tuples.map(([filepath]) => stageFile(filepath)));
  } catch (error) {
    return Promise.reject(error);
  }
};
