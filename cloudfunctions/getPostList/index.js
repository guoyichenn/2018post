// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init()

const db = cloud.database()
const post2018 = db.collection('post2018')

const request = require('request');
const cheerio = require('cheerio');
let start_time = '2018-01-01';
let end_time = '2018-12-31';

let httpForPost = async function (user_id, start) {
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
                        url: item_img_url,
                        date: item_date
                    }
                    result.push(resItem);
                }
                if(i == (nbg.length - 1) && item_date > end_time){
                    result.tooEarly = true
                }
            }
            resolve(result);
        });
    })
}

let addCollectionInDb = async function (list, userId) {
    if (!list || !list.length) {
        return 'add err'
    }
    let now = Date.now();
    return post2018.add({
        // data 字段表示需新增的 JSON 数据
        data: {
            list,
            userId,
            createdAt: now,
            isDeleted: false,
            updatedAt: now
        }
    })
        .then(res => {
            console.log(res);
            return 'add success'
        })
        .catch(err => {
            console.log(err);
            return 'add err';
        })
}

let getUserPost = async function (userId) {
    return post2018.where({
        userId,
        isDeleted: false
    })
    .get()
}

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    let user_id = event.user_id;
    let start = 0;
    let result = [];
    let colUserPost = await getUserPost(user_id);
    console.log(colUserPost);
    if(colUserPost && colUserPost.data && colUserPost.data[0] && colUserPost.data[0].list){
        result = colUserPost.data[0].list || [];
    }else{
        let resultList = await httpForPost(user_id, start) || [];
        while (resultList.length || resultList.tooEarly) {
            result = result.concat(resultList);
            start += 15
            resultList = await httpForPost(user_id, start)
        }
        retult = result.reverse();
        let dbRes = await addCollectionInDb(retult, user_id);
        console.log(dbRes);
    }
    return {
        code: 200,
        msg: '',
        result
    }
}