// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const request = require('request');
const cheerio = require('cheerio');
let start_time = '2018-01-01';
let end_time = '2018-12-31';

let httpForPost = async function(user_id, start) {
  let params = `start=${start}&sort=time&rating=all&filter=all&mode=grid`
  let url = `https://movie.douban.com/people/${user_id}/collect?` + params;
  return new Promise((resolve, reject) => {
      request(url, function (error, response, data) {
          let result = [];
          const $ = cheerio.load(data + '');
          let nbg = $('.nbg');
          let date = $('.date');
          for (let i = 0; i < nbg.length; i++) {
              let item_img_url = nbg[i].children[1].attribs.src;
              let item_date = date[i].children[0].data;
              if (item_date <= end_time && item_date >= start_time) {
                  let resItem = {
                      url : item_img_url,
                      date : item_date}
                  result.push(resItem);
              }
          }
          resolve(result);
      });
  })
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  let user_id = event.user_id;
  console.log(user_id);
  let start = 0;
  let resultList = await httpForPost(user_id, start) || [];
  let result = [];
  while (resultList.length) {
      result = result.concat(resultList);
      start += 15
      resultList = await httpForPost(user_id, start)
  }
  retult = result.reverse();
  return {
    code : 200,
    msg : '',
    result
  }
}