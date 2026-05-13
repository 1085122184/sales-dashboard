-- =========================================================
-- 登录认证 Oracle 增量脚本
-- 依赖：建议先执行 role-oracle-schema.sql
-- 作用：补齐用户表、登录日志表，并提供初始化管理员数据
-- =========================================================



SELECT * FROM SYS_USER



-- DY.V_SALES_DETAIL_ALL source

CREATE OR REPLACE FORCE VIEW "DY"."V_SALES_DETAIL_ALL" ("销售主产", "物料", "物料描述", "物料组", "物料组描述", "渠道", "销量", "金额", "单价", "客户名称", "过账日期", "工厂", "公司编码") AS 
  SELECT wuliao.销售主产 销售主产,物料, 物料描述, 物料组, 料组描述 , 渠道, 销量 ,金额,单价,客户名称,过账日期,工厂,xs.公司编码 
FROM (
SELECT 
    物料, 物料描述, 物料组, 物料组描述, 渠道, 
    CAST(销量 AS NUMBER) AS 销量,CAST(金额 AS NUMBER) AS 金额, CAST(单价 AS NUMBER) AS 单价, 
    客户名称, 过账日期, 工厂,'3000' AS 公司编码
FROM v_lvleng_rixiaoshou
WHERE 销量 <> 0 AND 渠道 <> '30' AND 物料组描述 <> '无价值物料'


) xs LEFT JOIN v_bd_wuliaoinfo wuliao ON wuliao.物料编码 = xs.物料;