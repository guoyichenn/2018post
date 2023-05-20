const cheerio = require("cheerio");
const axios = require("axios");
const XLSX = require("xlsx");
const _ = require("lodash");

const httpForPlant = async (name) => {
  let url = `https://www.iplant.cn/info/${name}`;
  const URI = encodeURI(url);
  const response = await axios.get(URI);
  const $ = cheerio.load(response.data + "");
  const infocname = $(".infocname")[0].children[0].data;
  // spno
  const spnoRegex = /var spno = "(\d+)";/;
  const spno =
    response.data.match(spnoRegex) && response.data.match(spnoRegex)[1];

  // nickname
  const nickRegex = /<div>俗名：([\s\S]*?)<div[^>]*>/;
  const nickMatches = response.data.match(nickRegex);
  const nickNameWithATag = nickMatches ? nickMatches[1] : "";
  const nickName = nickNameWithATag
    .replace(/<a[^>]*>/g, "")
    .replace(/<\/a>/g, "")
    .replace(/<\/div>/g, "");

  // get label
  const labelResponse = await axios.get(
    `https://www.iplant.cn/ashx/getclasssys.ashx?spid=${spno}`
  );
  const label = labelResponse.data.genctxt;

  // get infoLatin
  const formData = new URLSearchParams();
  formData.append("spno", spno);
  const infoLatinRes = await axios.post(
    `https://www.iplant.cn/ashx/getsplatin.ashx`,
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  let infoLatin = infoLatinRes.data
    .replace(/<span[^>]*>/g, "")
    .replace(/<\/span>/g, "")
    .replace(/<b>/g, "")
    .replace(/<\/b>/g, "");

  return { infocname, label, infoLatin, nickName };
};

(async () => {
  // redFile
  const workbook = XLSX.readFile("./pre-run.xlsx");
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const dataArray = jsonData.slice(1); // Exclude header row

  const willUpdateDataArray = _.cloneDeep(dataArray);
  for (let i = 0; i < willUpdateDataArray.length; i++) {
    const item = willUpdateDataArray[i];
    console.log(item[1]);
    let result = await httpForPlant(item[1]);
    item.push(result.nickName);
    if (
      result.infocname === item[1] &&
      result.label === item[2] &&
      result.infoLatin === item[3]
    ) {
      console.log("success");
    } else {
      item.push(result.infocname);
      item.push(result.label);
      item.push(result.infoLatin);
    }
  }

  const workbookNew = XLSX.utils.book_new();
  const worksheetNew = XLSX.utils.aoa_to_sheet(willUpdateDataArray);
  XLSX.utils.book_append_sheet(workbookNew, worksheetNew, "Sheet 1");
  XLSX.writeFile(workbookNew, "./has-ran.xlsx");
  console.log("all done");
})();
