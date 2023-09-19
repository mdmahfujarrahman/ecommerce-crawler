import jsonfile from "jsonfile";
import fs from "fs/promises";

const file = "crawlerData.json";

(async () => {
    try {
        await fs.access(file);
    } catch (error) {
        await jsonfile.writeFile(file, {});
    }
})();
export const saveToDb = async (url, data) => {
    try {
        const db = await jsonfile.readFile(file);
        db[url] = data;
        await jsonfile.writeFile(file, db, {
            spaces: 2,
        });
    } catch (error) {
        console.log(error);
    }
};
