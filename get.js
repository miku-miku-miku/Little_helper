// 从URL获取参数的函数
function getUrlParams() {
    const params = {};
    const url = window.location.search;
    if (url.indexOf('?') !== -1) {
        const str = url.substr(1);
        const strs = str.split('&');
        strs.forEach(item => {
            const [key, value] = item.split('=');
            if (key) params[key] = decodeURIComponent(value || '');
        });
    }
    return params;
}

// 获取店铺信息的主函数
async function getDPXX() {
    // 初始化变量（优先从URL参数获取，无参数则用默认值）
    const urlParams = getUrlParams();
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