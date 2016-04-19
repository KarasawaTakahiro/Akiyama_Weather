var Botkit = require("botkit");
var request = require("request");
var Curl = require("node-libcurl").Curl;

var weather_url = "http://api.openweathermap.org/data/2.5/weather?id=";

var city_id = {
	"chiyoda-ku": "1864529"
}

var weather_condition_id_table = {
0: "不明",
   1: "雷雨", 2: "小雨", 3: "雨",
   4: "雪", 5: "快晴", 6: "曇り",
};

var basic_saying = [
	"スピーディに",
	"理想を持って",
	"恐れず",
	"核心を突いた",
	"脱属人化する為の",
	"求職者が列をなした",
	"独立独歩できる",
];

var in_temp = 28;	// C
var interval = 1 * 60 * 1000	// 1min

var controller = Botkit.slackbot({
debug: false
});


controller.spawn({ token: 'xoxb-35471024976-tTohKIYsK5Zn4Ab4bFfgrKRG' }).startRTM()

// say hi
controller.hears('hi',['direct_message','direct_mention','mention'],function(bot,message) {
		var temp, temp_min, temp_max, weather_code, diff_high, diff_low;
		var cb = function(err, res, body){
			temp = k2c(body.main.temp);
			temp_max = k2c(body.main.temp_max);
			temp_min = k2c(body.main.temp_min);
			weather_code = body.weather[0].id;
			diff_high = Math.abs(temp_max - in_temp);
			diff_low = Math.abs(temp_min - in_temp);
			wind = body.wind.speed;

			bot.reply(message, genMessage(
						weather_condition_id_table[convWeatherConditionCode2Id(weather_code)],
						temp,
						temp_min,
						temp_max,
						in_temp,
						diff_high,
						diff_low,
						wind
						));
		};
		requestAjax(weather_url+city_id["chiyoda-ku"], cb);
});


// 話しかける
function say(user, text, callback){
	var options = {
		url: "https://slack.com/api/chat.postMessage",
		method: "POST",
		form: {
			"token": "xoxb-35471024976-tTohKIYsK5Zn4Ab4bFfgrKRG",
			"channel": "@"+user,
			"text": text,
			"as_user": "true",
			"link_names": "1",
		},
	};
	request(options, callback);
};

// Ajax
function requestAjax(endpoint, callback){
	var options = {
url: endpoint,
     method: "GET",
     json: true
	};
	request(options, callback);
};


// F to C
function k2c(k){
	return Math.floor((parseFloat(k) - 273.5) * 10) / 10;	// 華氏を摂氏に変換して0.1のくらいで切り捨て
};


// create message
function genMessage(weather, temp, temp_min, temp_max, in_temp, diff_high, diff_low, wind){
	var pre = "";
	var mess;
	var saying;
	var avg = Math.floor((temp_max + temp_min) / 2 * 10) / 10;	// temp avg

	saying = basic_saying[Math.floor(Math.random()*(basic_saying.length))];

	if(15 <= wind){
		pre = "風が強いから";
		mess = "スカートは避けよう";
	}else if(30 <= avg){
		mess = "水分補給を怠らず";
	}else if(avg <= 20){
		mess = "ロンT1枚で、いいんじゃないかな。";
	}else if(16 <= avg && avg <= 20){
		mess = "シャツと、羽織るものがあればいいかも";
	}else if(14 <= avg && avg <= 16){
		mess = "薄手のアウターは必須";
	}else if(5 <= avg && avg <= 14){
		mess = "コートを着よう";
	}else{
		mess = "ちょー厚いコートと手袋。それと帽子。";
	}

	return ("今日の天気は" + weather + "、だよね。\n"
			+ "外気温は最低" + temp_min + "℃で最高" + temp_max + "℃。\n"
			+ "社内気温は" + in_temp + "℃に設定しているよ\n"
			+ "風速は" + wind + "m/s\n"
			+ "で、あるならば\n"
			+ pre + "\n"
			+ saying + "\n"
			+ mess);
};

// weather condition
function convWeatherConditionCode2Id(code){
	var code = parseInt(code);

	if(200 <= code && code <= 232){
		return 1;
	}else if(300 <= code && code <= 321){
		return 2;
	}else if(500 <= code && code <= 531){
		return 3;
	}else if(600 <= code && code <= 622){
		return 4;
	}else if(800 <= code && code <= 801){
		return 5;
	}else if(802 <= code && code <= 804){
		return 6;
	}else{
		return 0;
	}
};


// お知らせまとめ
function jihou(){
	var temp, temp_min, temp_max, weather_code, diff_high, diff_low, wind;
	var cb = function(err, res, body){
		temp = k2c(body.main.temp);
		temp_max = k2c(body.main.temp_max);
		temp_min = k2c(body.main.temp_min);
		weather_code = body.weather[0].id;
		diff_high = Math.abs(temp_max - in_temp);
		diff_low = Math.abs(temp_min - in_temp);
		wind = body.wind.speed;

		say("karasawa", genMessage(
					weather_condition_id_table[convWeatherConditionCode2Id(weather_code)],
					temp,
					temp_min,
					temp_max,
					in_temp,
					diff_high,
					diff_low,
					wind
					));
	};
	requestAjax(weather_url+city_id["chiyoda-ku"], cb);
};

// 一定時間ごとに行う処理
function routine(){
	jihou();
	setNextTimer();
};

// タイマーのセット
function setNextTimer(){
	var now = new Date().getTime();
	var next = (Math.floor(now/interval)+1) * interval;
	setTimeout(routine, next-now);
};


// タイマースタート
setNextTimer();


// DEMO CODE

var demo = [
 {temp: 10, temp_min: 10.0, temp_max: 20.0, weather_code: 200, diff_high: 0, diff_low: 0, wind: 16},
 {temp: 10, temp_min: 10.0, temp_max: 40.0, weather_code: 300, diff_high: 0, diff_low: 0, wind: 10},
 {temp: 10, temp_min: 0.0, temp_max: 29.0, weather_code: 500, diff_high: 0, diff_low: 0, wind: 10},
 {temp: 10, temp_min: 0.0, temp_max: 19.0, weather_code: 600, diff_high: 0, diff_low: 0, wind: 10},
 {temp: 10, temp_min: 0.0, temp_max: 16.0, weather_code: 800, diff_high: 0, diff_low: 0, wind: 10},
 {temp: 10, temp_min: 0.0, temp_max: 10.0, weather_code: 802, diff_high: 0, diff_low: 0, wind: 10},
];

controller.hears(["demo."],['direct_message','direct_mention','mention'],function(bot,message) {
		var temp, temp_min, temp_max, weather_code, diff_high, diff_low, wind;
		var demo_id;

		demo_id = message.text.match(/demo./)["input"];
		console.log(message.text.match(/demo./));
		if(demo_id < 4){
			demo_id = 0;
		}else{
			demo_id = parseInt(demo_id.slice(4));
		}
		console.log(demo_id);
		console.log(demo[demo_id]);
		temp         = demo[demo_id].temp;
		temp_max     = demo[demo_id].temp_max;
		temp_min     = demo[demo_id].temp_min;
		weather_code = demo[demo_id].weather_code;
		diff_high    = demo[demo_id].diff_high;
		diff_low     = demo[demo_id].diff_low;
		wind         = demo[demo_id].wind;

		bot.reply(message, genMessage(
					weather_condition_id_table[convWeatherConditionCode2Id(weather_code)],
					temp,
					temp_min,
					temp_max,
					in_temp,
					diff_high,
					diff_low,
					wind
					));
		});
