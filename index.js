/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Use this project as the starting point for following the
 * Messenger Platform quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

'use strict';

// Imports dependencies and set up http server
const
    request = require('request'),
    express = require('express'),
    body_parser = require('body-parser'),
    app = express().use(body_parser.json()); // creates express http server

const PAGE_ACCESS_TOKEN = 'EAADveDdj9tABAMR7gSlgqLOH53gMJRWr9WEozElAMrRwzsHt1JQ8qZCMAqr0MO4BeR9sNeE9PAXjZCXN8s21cMabNHUfdZBpCqqECtPcKUQANcWcplL1ulvCICbWYZCnjIz6BZCEBZBIGmk16OaqBL6rtCTi7jdHKclfzT3ZChXkwZDZD';
//分析語法開始
var apiai = require('apiai');
var apiaiapp = apiai('83c8cbe12da743ff823cadbd60df09ae', '4d68a32def6841d7b26813cdca3bdc8f');
//分析語法結束
//爬蟲開始
var cheerio = require('cheerio');
var moment = require('moment');
var momentz = require('moment-timezone');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
// request('http://www.google.com/', function(err, resp, html){
//     if(!err){
//         const $ = cheerio.load(html);
//         console.log(html);
//     }
// });
// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

    /** UPDATE YOUR VERIFY TOKEN **/
    const VERIFY_TOKEN = PAGE_ACCESS_TOKEN;

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {

    let response;
    let strStation;
    let arrStation;
    var request = apiaiapp.textRequest(received_message.text, {sessionId: sender_psid});
    request.on('response', function(response){
        if(response.result.action == "train"){
            strStation = response.result.parameters.start_station;
            arrStation = response.result.parameters.arrive_station;
            console.log('起點'+strStation);
            console.log('終點'+arrStation);
            TrainSchedule(strStation, arrStation, sender_psid);
        }else {
            // Check if the message contains text
            if (received_message.text) {
                switch (received_message.text) {
                    case '公道價八萬一' :
                        response = {
                            "text": '你在大聲甚麼啦!'
                        };
                        break;
                    case 'structure' :
                        callSendStructuredAPI(sender_psid);
                        break;
                    default :
                        response = {
                            "text": `You sent the message: "${received_message.text}". Now send me an image!`
                        };
                }
            } else if (received_message.attachments) {
                response = {
                    "text": `這是附件`
                };
            }
        }
        // Sends the response message
        if(received_message.text != 'structure'){
            callSendAPI(sender_psid, response);
        }
    });
    request.end();


}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

function callSendStructuredAPI(sender_psid){
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: '這是對的圖嗎?',
                        subtitle: '按下按鈕吧',
                        image_url: 'https://i.imgur.com/i9jFz7I.jpg',//'https://upload.wikimedia.org/wikipedia/ah/thumb/5/5d'
                        buttons: [
                            {
                                type: "postback",
                                title: "yes",
                                payload: "yes"
                            },
                            {
                                type: "postback",
                                title: "no",
                                payload: "no"
                            }
                        ],
                    }]
                }
            }
        }
    };

    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}


// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

//爬蟲
function TrainSchedule(str_station,arrStation,sender_psid){
    console.log('查火車');

    var str_sta,arr_sta;
    var response;
    str_sta = station_code(str_station);
    arr_sta = station_code(arrStation);
    var url = 'http://twtraffic.tra.gov.tw/twrail/SearchResult.aspx?searchtype=0&searchdate='+ moment().tz('Asia/Taipei').format('YYYY/MM/DD').toString() +'&fromstation='+str_sta+'&tostation='+arr_sta+'&trainclass=2&timetype=undefined&fromtime='+ moment().tz('Asia/Taipei').format('HHmm').toString() + '&totime=2359';
    console.log(url);
    let classname = [];
    let timeoftrain = [];
    request(url, (err, res, body)=>{
        var $ = cheerio.load(body);
        $('span[id=classname]').each(function(i,elem){
            classname[i] = $(this).text();
        });
        $ = cheerio.load(body);
        $('td[class=SearchResult_Time]').each(function(i,elem){
            timeoftrain[i] = $(this).text();
        });
        console.log('good');

        // for(var i = 0;i< timeoftrain.length ; i+=2){
        //     response += {
        //         "text": classname[i]+'  '+timeoftrain[i]+'出發'+timeoftrain[i+1]+'到達\n'
        //     };
        //
        // }
        // console.log(response);
        //callSendAPI(sender_psid, response);

    })
}
function station_code(station_name){
    switch (station_name) {
        //北區
        case '福隆':
            return 1810;
        case '貢寮':
            return 1809;
        case '雙溪':
            return 1808;
        case '牡丹':
            return 1807;
        case '三貂嶺':
            return 1806;
        case '猴硐':
            return 1805;
        case '瑞芳':
            return 1804;
        case '四腳亭':
            return 1803;
        case '暖暖':
            return 1802;
        case '基隆':
            return 1001;
        case '三坑':
            return 1029;
        case '八堵':
            return 1002;
        case '七堵':
            return 1003;
        case '百福':
            return 1030;
        case '五堵':
            return 1004;
        case '汐止':
            return 1005;
        case '汐科':
            return 1031;
        case '南港':
            return 1006;
        case '松山':
            return 1007;
        case '臺北':
            return 1008;
        case '台北':
            return 1008;
        case '萬華':
            return 1009;
        case '板橋':
            return 1011;
        case '浮洲':
            return 1032;
        case '樹林':
            return 1012;
        case '南樹林':
            return 1034;
        case '山佳':
            return 1013;
        case '鶯歌':
            return 1014;
        case '桃園':
            return 1015;
        case '內壢':
            return 1016;
        case '中壢':
            return 1017;
        case '埔心':
            return 1018;
        case '楊梅':
            return 1019;
        case '富岡':
            return 1020;
        case '新富':
            return 1036;
        case '北湖':
            return 1033;
        case '湖口':
            return 1021;
        case '新豐':
            return 1022;
        case '竹北':
            return 1023;
        case '北新竹':
            return 1024;
        case '新竹':
            return 1025;
        case '三姓橋':
            return 1035;
        case '香山':
            return 1026;
        case '菁桐':
            return 1908;
        case '平溪':
            return 1907;
        case '嶺腳':
            return 1906;
        case '望古':
            return 1905;
        case '十分':
            return 1904;
        case '大華':
            return 1903;
        case '海科館':
            return 6103;
        case '八斗子':
            return 2003;
        case '千甲':
            return 2212;
        case '新莊':
            return 2213;
        case '竹中':
            return 2203;
        case '六家':
            return 2214;
        case '上員':
            return 2204;
        case '榮華':
            return 2211;
        case '竹東':
            return 2205;
        case '橫山':
            return 2206;
        case '九讚頭':
            return 2207;
        case '合興':
            return 2208;
        case '富貴':
            return 2209;
        case '內灣':
            return 2210;

        //中區
        case '崎頂':
            return 1027;
        case '竹南':
            return 1028;
        case '談文':
            return 1102;
        case '大山':
            return 1104;
        case '後龍':
            return 1105;
        case '龍港':
            return 1106;
        case '白沙屯':
            return 1107;
        case '新埔':
            return 1108;
        case '通霄':
            return 1109;
        case '苑裡':
            return 1110;
        case '造橋':
            return 1302;
        case '豐富':
            return 1304;
        case '苗栗':
            return 1305;
        case '南勢':
            return 1307;
        case '銅鑼':
            return 1308;
        case '三義':
            return 1310;
        case '日南':
            return 1111;
        case '大甲':
            return 1112;
        case '臺中港':
            return 1113;
        case '台中港':
            return 1113;
        case '清水':
            return 1114;
        case '沙鹿':
            return 1115;
        case '龍井':
            return 1116;
        case '大肚':
            return 1117;
        case '追分':
            return 1118;
        case '泰安':
            return 1314;
        case '后里':
            return 1315;
        case '豐原':
            return 1317;
        case '潭子':
            return 1318;
        case '太原':
            return 1323;
        case '臺中':
            return 1319;
        case '台中':
            return 1319;
        case '大慶':
            return 1322;
        case '烏日':
            return 1320;
        case '新烏日':
            return 1324;
        case '成功':
            return 1321;
        case '彰化':
            return 1120;
        case '花壇':
            return 1202;
        case '大村':
            return 1240;
        case '員林':
            return 1203;
        case '永靖':
            return 1204;
        case '社頭':
            return 1205;
        case '田中':
            return 1206;
        case '二水':
            return 1207;
        case '林內':
            return 1208;
        case '石榴':
            return 1209;
        case '斗六':
            return 1210;
        case '斗南':
            return 1211;
        case '石龜':
            return 1212;
        case '源泉':
            return 2702;
        case '濁水':
            return 2703;
        case '龍泉':
            return 2704;
        case '集集':
            return 2705;
        case '水里':
            return 2706;
        case '車埕':
            return 2707;

        //南區
        case '大林':
            return 1213;
        case '民雄':
            return 1214;
        case '嘉北':
            return 1241;
        case '嘉義':
            return 1215;
        case '水上':
            return 1217;
        case '南靖':
            return 1218;
        case '後壁':
            return 1219;
        case '新營':
            return 1220;
        case '柳營':
            return 1221;
        case '林鳳營':
            return 1222;
        case '隆田':
            return 1223;
        case '拔林':
            return 1224;
        case '善化':
            return 1225;
        case '南科':
            return 1244;
        case '新市':
            return 1226;
        case '永康':
            return 1227;
        case '大橋':
            return 1239;
        case '臺南':
            return 1228;
        case '台南':
            return 1228;
        case '保安':
            return 1229;
        case '仁德':
            return 1243;
        case '中洲':
            return 1230;
        case '大湖':
            return 1231;
        case '路竹':
            return 1232;
        case '岡山':
            return 1233;
        case '橋頭':
            return 1234;
        case '楠梓':
            return 1235;
        case '新左營':
            return 1242;
        case '左營':
            return 1236;
        case '高雄':
            return 1238;
        case '鳳山':
            return 1402;
        case '後庄':
            return 1403;
        case '九曲堂':
            return 1404;
        case '六塊厝':
            return 1405;
        case '屏東':
            return 1406;
        case '歸來':
            return 1407;
        case '麟洛':
            return 1408;
        case '西勢':
            return 1409;
        case '竹田':
            return 1410;
        case '潮州':
            return 1411;
        case '崁頂':
            return 1412;
        case '南州':
            return 1413;
        case '鎮安':
            return 1414;
        case '林邊':
            return 1415;
        case '佳冬':
            return 1416;
        case '東海':
            return 1417;
        case '枋寮':
            return 1418;
        case '加祿':
            return 1502;
        case '內獅':
            return 1503;
        case '枋山':
            return 1504;
        case '長榮大學':
            return 5101;
        case '沙崙':
            return 5102;

        //東區
        case '大武':
            return 1508;
        case '瀧溪':
            return 1510;
        case '金崙':
            return 1512;
        case '太麻里':
            return 1514;
        case '知本':
            return 1516;
        case '康樂':
            return 1517;
        case '臺東':
            return 1632;
        case '台東':
            return 1632;
        case '台東':
            return 1632;
        case '山里':
            return 1631;
        case '鹿野':
            return 1630;
        case '瑞源':
            return 1629;
        case '瑞和':
            return 1628;
        case '關山':
            return 1626;
        case '海端':
            return 1625;
        case '池上':
            return 1624;
        case '富里':
            return 1623;
        case '東竹':
            return 1622;
        case '東里':
            return 1621;
        case '玉里':
            return 1619;
        case '三民':
            return 1617;
        case '瑞穗':
            return 1616;
        case '富源':
            return 1614;
        case '大富':
            return 1613;
        case '光復':
            return 1612;
        case '萬榮':
            return 1611;
        case '鳳林':
            return 1610;
        case '南平':
            return 1609;
        case '豐田':
            return 1607;
        case '壽豐':
            return 1606;
        case '平和':
            return 1605;
        case '志學':
            return 1604;
        case '吉安':
            return 1602;
        case '花蓮':
            return 1715;
        case '北埔':
            return 1714;
        case '景美':
            return 1713;
        case '新城':
            return 1712;
        case '崇德':
            return 1711;
        case '和仁':
            return 1710;
        case '和平':
            return 1709;
        case '漢本':
            return 1708;
        case '武塔':
            return 1706;
        case '南澳':
            return 1705;
        case '東澳':
            return 1704;
        case '永樂':
            return 1703;
        case '蘇澳':
            return 1827;
        case '蘇澳新':
            return 1826;
        case '新馬':
            return 1825;
        case '冬山':
            return 1824;
        case '羅東':
            return 1823;
        case '中里':
            return 1822;
        case '二結':
            return 1821;
        case '宜蘭':
            return 1820;
        case '四城':
            return 1819;
        case '礁溪':
            return 1818;
        case '頂埔':
            return 1817;
        case '頭城':
            return 1816;
        case '外澳':
            return 1815;
        case '龜山':
            return 1814;
        case '大溪':
            return 1813;
        case '大里':
            return 1812;
        case '石城':
            return 1811;

        default:
        // code
    }
}