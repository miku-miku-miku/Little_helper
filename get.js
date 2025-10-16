// 在页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 名人名言数组（可自行修改或添加）
    const famousQuotes = [
        "生命如同寓言，其价值不在长短，而在内容。 —— 塞内卡",
        "我们唯一需要恐惧的是恐惧本身。 —— 罗斯福",
        "知识就是力量。 —— 培根",
        "己所不欲，勿施于人。 —— 孔子",
        "一个人的价值，应该看他贡献什么，而不应当看他取得什么。 —— 爱因斯坦",
        "患难及困苦，是磨炼人格的最高学府。 —— 苏格拉底",
		"一万年太久，只争朝夕 —— 毛泽东",
		"而今迈步从头越，从头越，苍山如海，残阳如血 —— 毛泽东",
		"路漫漫其修远兮，吾将上下而求索 —— 屈原",
		"不要同敌人过多的战斗，除非你想领教战争的艺术 —— 拿破仑",
		"你这么闲的话，就去多搬几块砖",
		"点我很好玩？",
		"点我有彩蛋哦",
		"哦~大海",
		"王侯将相，宁有种乎",
		"是谁创造了这个世界，使我们劳动群众 —— 国际歌",
		"一切归劳动者所有，哪能容得寄生虫 —— 国际歌",
		"起来饥寒交迫的奴隶，起来全世界受苦的人 —— 国际歌",
		"不要看他说了什么，要看他做了什么",
		"三分钟热度，也有三分钟收获",
    ];

    // 找到"特别说明"元素（假设其id为"specialNote"，如果实际id不同请修改）
    const specialNote = document.getElementById('specialNote');
    
    // 如果找到了特别说明元素
    if (specialNote) {
        // 创建显示名言的元素
        const quoteElement = document.createElement('div');
        quoteElement.id = 'famousQuote';
        quoteElement.className = 'mt-2 text-sm text-gray-600 italic'; // 可根据样式调整
        quoteElement.style.transition = 'opacity 0.3s ease';
        
        // 将名言元素添加到特别说明下方
        specialNote.appendChild(quoteElement);
        
        // 随机显示一条名言的函数
        function showRandomQuote() {
            // 添加淡出效果
            quoteElement.style.opacity = '0';
            
            // 短暂延迟后更新内容并淡入
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * famousQuotes.length);
                quoteElement.textContent = famousQuotes[randomIndex];
				console.log(randomIndex)
				if(randomIndex==13){
					const w=document.getElementById('wave-canvas');
					w.style.opacity='1';//将海浪的背景颜色改为显示
				}
                quoteElement.style.opacity = '1';
            }, 300);
        }
        
        // 初始显示一条名言
        showRandomQuote();
        
        // 给特别说明添加点击事件，点击时刷新名言
        specialNote.addEventListener('click', showRandomQuote);
        
        // 可选：添加鼠标悬停效果提示可点击
        specialNote.style.cursor = 'pointer';
        specialNote.title = '点击刷新名言';
    }else{
		alert("哎呀，网页崩溃了，刷新试试看")
	}
});

// 获取店铺信息的主函数
async function getDPXX() {
    const dpmc = localStorage.getItem("dpmc");//店铺名称
    const dppt = localStorage.getItem("pt"); // 店铺类型
    let token = localStorage.getItem("youtoken");
    let qysh = "";
    let spid = "";

    try {
        // 1. 获取Token
        console.log("获取Token成功:", token);

        // 2. 获取企业信息
        const companyResponse = await $.ajax({
            "url": 'https://mycst.cn//NEWKP/DSKP/DPTBJL?pageindex=1&pagesize=30&gzj='+dpmc+'&token='+token,
            "method": "POST",
            "timeout": 0,
        });
        if (!companyResponse.rows || companyResponse.rows.length === 0) {
            throw new Error("未找到企业信息，可检查店铺名称");
        }else{
			companyResponse.rows.forEach(function(i){
				if(companyResponse.rows[0].DPMC==dpmc){
					 qysh = companyResponse.rows[0].QYSH;
					 console.log("获取企业信息成功，QYSH:", qysh);
				}
			})
		}
        // 3. 获取分机号信息
        const extensionResponse = await $.ajax({
            "url": `https://51dzfp.cn/NEWKP//TERM/KPFJLIST?qysh=${qysh}&token=${token}`,
            "method": "POST",
            "timeout": 0,
        });
        if (!extensionResponse.rows || extensionResponse.rows.length === 0) {
            throw new Error("未找到分机号信息");
        }
        // 查找符合条件的分机号
        const targetExtension = extensionResponse.rows.find(item => 
            item.FJH == 1 && item.ZDLXMS === "全电发票"
        );
        if (!targetExtension) {
            throw new Error("未找到符合条件的分机号");
        }
        spid = targetExtension.SPID;
        console.log("获取分机号成功，SPID:", spid);

        // 4. 获取店铺列表并查找目标店铺
        const shopListResponse = await $.ajax({
            "url": `https://51dzfp.cn/NEWKP/DSKP/DPLIST?dsdpsz=1&pageindex=1&pagesize=50&spid=${spid}&token=${token}`,
            "method": "POST",
            "timeout": 0,
        });
        if (!shopListResponse.rows || shopListResponse.rows.length === 0) {
            throw new Error("未获取到店铺列表");
        }
        // 查找匹配的店铺
        const targetShop = shopListResponse.rows.find(shop => 
            shop.DPMC.trim() === dpmc.trim() && shop.DPLXMC.trim() === dppt.trim()
        );
        if (!targetShop) {
			console.log(shopListResponse.rows)
            throw new Error("未找到匹配的店铺");
        }

        console.log("找到目标店铺:", targetShop);
        return {
            success: true,
            data: {
                dpmc: targetShop.DPMC,
                sqwz: targetShop.SQWZ,
                // 可根据需要添加其他店铺信息字段
                //...targetShop
            }
        };

    } catch (error) {
        console.error("获取店铺信息失败:", error.message);
        return {
            success: false,
            error: error.message
        };
    }
}















