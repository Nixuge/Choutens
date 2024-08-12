import { readdirSync, existsSync, copyFileSync, writeFileSync, readFileSync, rmSync, renameSync } from 'fs'
import { zip } from 'zip-a-folder';
import { build } from 'esbuild';

function getDirectories(source: string) {
    return readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
}

function getIndex(source: string) {
    const indexFiles = readdirSync(`./src/${source}/`, { withFileTypes: true })
        .filter(file => ["index.ts", `${source}.ts`].includes(file.name.toLowerCase()))
        .map(file => file.name);
    
    if (indexFiles.length == 0) 
        return undefined;

    if (indexFiles.length > 1)
        console.warn(`Multiple index files found for folder ${source}; using index.ts.`)

    return indexFiles[0];
}

async function buildModule(folder: string, index: string) {
    let inputPath = `./src/${folder}/${index}`;

    let meta: any; // lmao dirty
    await import(inputPath).then((a) => {
        meta = new a.default().metadata;        
    });
    
    let moduleFolder = `./out/Modules/${meta.id}`

    // U love to see it - mkdirs all folders
    await build({
        entryPoints: [`${inputPath}`],
        bundle: true,
        target: 'safari11',
        outfile: `${moduleFolder}/code.js`,
        globalName: 'source',
    }).catch(() => { throw Error(`Couldn't run esbuild on file ${inputPath}.`) });
    
    if (meta.iconPath) {
        const icon = meta.iconPath;
        if (existsSync(`./meta/${icon}`)) {
            copyFileSync(`./meta/${icon}`, `${moduleFolder}/icon.png`);
        } else {
            console.warn(`Provided icon "${icon}" couldn't be found.`);
        }
    }

    writeFileSync(`${moduleFolder}/metadata.json`, JSON.stringify(meta, undefined, 4));

    await zip(moduleFolder, `${moduleFolder}.module`);

    return meta;
}

async function buildRepo() {
    // Load repo meta
    const configPath = "./meta/config.json"
    if (!existsSync(configPath)) {
        throw Error(`${configPath} file does not exist.`);
    }
    const repoMeta = JSON.parse(readFileSync(configPath).toString());
    repoMeta["modules"] = [];
    
    // Build all modules
    // Not using async to save like .2s to keep the original order (actually it's the node list file order so idk?
    // only advantage I can see is that modules won't change places between updates)
    for (const folder of getDirectories("src/")) {
        const index = getIndex(folder);
        if (index === undefined) {
            console.warn(`Folder "${folder}" does not contain a source.`);
            continue;
        }
        let moduleMeta = await buildModule(folder, index);
        delete moduleMeta.description;
        delete moduleMeta.type;
        moduleMeta["filePath"] = `./Modules/${moduleMeta.id}.module`

        repoMeta["modules"].push(moduleMeta);
    }

    if (existsSync("./meta/icon.png")) {
        copyFileSync("./meta/icon.png", "./out/icon.png");
    } else {
        console.warn("No icon found at ./meta/icon.png. Please provide one for your repository.");
    }

    writeFileSync("./out/metadata.json", JSON.stringify(repoMeta, undefined, 4));

    // Temporary (?)
    await zip("./out", "./repo.zip");
    renameSync("./repo.zip", "./out/repo.zip");

    // Temporary
    writeFileSync("./out/index.html", "*** under construction ***<br><br>you should still be able to use this repo in the app.")
}

rmSync("./out", {recursive: true})

buildRepo()
