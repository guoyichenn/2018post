const cheerio = require("cheerio");
const axios = require("axios");
const XLSX = require("xlsx");
const _ = require("lodash");
const XLSX_STYLE = require("xlsx-style");
const ExcelJS = require("exceljs");

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
    .replace(/<\/span>/g, "");

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

  // Create a new workbook
  const workbookNew = new ExcelJS.Workbook();

  // Create a new worksheet
  const worksheetNew = workbookNew.addWorksheet("Sheet1");

  worksheetNew.addRows(willUpdateDataArray);

  const latinColNumber = 9;

  // Iterate over the AOA data
  for (let rowIndex = 0; rowIndex < willUpdateDataArray.length; rowIndex++) {
    // Get the cell in the desired column
    const cell = worksheetNew.getCell(rowIndex + 1, latinColNumber + 1);

    // Create a rich text segment with the desired formatting
    // const segment = {
    //   text: aoaData[rowIndex][columnIndex],
    //   font: { color: { argb: "FF0000" } },
    // };
    const inputString = willUpdateDataArray[rowIndex][latinColNumber];

    // Regular expression pattern to match <b>...</b> tags
    const tagPattern = /<b>(.*?)<\/b>/g;

    // Regular expression pattern to match non-tag text
    const segments = [];

    // Find all matches of <b>...</b> tags in the input string
    const tagMatches = inputString.match(tagPattern);
    const tagMatchesResult = tagMatches.map((match) =>
      match.replace(/<\/?b>/g, "")
    );

    // Find all matches of non-tag text in the input string
    const textMatches = inputString
      .split(tagPattern)
      .filter((text) => text !== "");

    // Iterate over the matches and create the result objects
    for (let i = 0; i < textMatches.length; i++) {
      const text = textMatches[i];
      const isBold = tagMatchesResult.indexOf(text) > -1;

      segments.push({
        text,
        font: { italic: isBold },
      });
    }
    cell.value = {
      richText: segments,
    };
  }

  workbookNew.xlsx.writeFile("has-ran.xlsx").then(() => {
    console.log("File saved!");
  });
})();
