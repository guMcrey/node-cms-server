const express = require('express');
const router = express.Router();
const { query, connection } = require('../data/config');

router.get('/', function (req, res, next) {
    res.send('apis');
});


/** 
 * 接口: 新建文章
 * 字段: title, main_img, content, url, publish_time, author, tag, description, publish_status
*/
router.post('/articles', async (req, res) => {
    const { title, url, author, content, description, publish_time, publish_status, tag } = req.body
    let articleId = undefined;

    if (!title) {
        return res.status(400).send({
            message: 'Json Format Error'
        })
    }

    try {
        // 插入 article 信息
        const articleRows = await query(`INSERT INTO article SET ?`, { title, url, author, content, description, publish_time, publish_status })
        articleId = articleRows.insertId

        // 查询 tag 并过滤
        let createTag = []
        for (const i of tag) {
            const isExistTag = await query(`SELECT * FROM tag WHERE tag_name = '${i}'`)
            if (!isExistTag.length) {
                createTag.push(i)
            }
        }

        // 插入 tag 信息
        if (createTag.length) {
            await query(`INSERT INTO tag (tag_name) VALUES ${createTag.map((_) => `("${_}")`)}`)
            // 插入 article_tag 关联信息
            await query(`INSERT INTO article_tag (article_id, tag_name) VALUES ${tag.map((_) => `(${articleId}, "${_}")`)}`)
        }

    } catch (e) {
        res.status(500).send({
            message: 'Create Error'
        })
    }

    res.status(200).send({
        articleId,
        message: 'Success'
    })
});


/**
 * 接口: 获取文章
 * 查询条件: title, publishTime, tag, publishStatus 
 * 参数: curPage, pageSize
 */
router.get('/articles', (req, res) => {
    const title = req.query.title || '';
    const publishTime = req.query.publishTime || '';
    const tag = req.query.tag || '';
    const publishStatus = req.query.publishStatus || '';

    const curPage = req.query.curPage ? parseInt(req.query.curPage) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 15;
    const params = [(curPage - 1) * pageSize, pageSize];

    let sql = 'SELECT * FROM article';
    let count = 0

    if (title || publishTime || tag || publishStatus) {
        sql += ' WHERE'
    }

    if (title) {
        sql += ` title LIKE "%${title}%"`;
        count++;
    }
    if (publishTime) {
        sql += count > 0 ? ` AND publish_time="${publishTime}"` : ` publish_time="${publishTime}"`;
        count++;
    }
    if (tag) {
        sql += count > 0 ? ` AND tag="${tag}"` : ` tag="${tag}"`;
        count++;
    }
    if (publishStatus) {
        sql += count > 0 ? ` AND publish_status="${publishStatus}"` : ` publish_status="${publishStatus}"`;
        count++;
    }

    connection.query(sql, (error, data) => {
        if (error) throw error;
        //  limit M offset N: 从第 N 条记录开始, 返回 M 条记录
        connection.query(`${sql} LIMIT ?, ?`, params, (error, result) => {
            if (error) throw error;
            res.status(200).send({
                result,
                pagination: {
                    pageSize,
                    curPage,
                    total: data.length,
                },
            })
        })
    })
})

/**
 * 接口功能: 获取某条文章详情
 * 参数: article_id
 */
router.get('/articles/:article_id', (req, res) => {
    const articleId = req.params.article_id;
    connection.query(`SELECT * FROM article WHERE article_id = '${articleId}'`, (error, result) => {
        if (error) throw error;
        res.status(200).send({
            result
        })
    })
})


/**
 * 接口功能: 修改文章
 * 修改字段: title, mainImg, content, url, publishTime, author, tag, description, publishStatus
 */
router.put('/articles/:article_id', (req, res) => {
    const articleId = req.params.article_id;
    const { title } = req.body;

    if (!title || !articleId) {
        return res.status(400).send({
            message: 'Json Format Error'
        })
    }

    connection.query(`UPDATE article SET ? WHERE article_id = ?`, [req.body, articleId], (error, result) => {
        if (error) throw error;
        res.status(200).send({
            articleId: result.changedRows,
        })
    })
})


/**
 * 接口功能: 删除某篇文章
 * 必要字段: articleId
 */
router.delete('/articles/:article_id', (req, res) => {
    const articleId = req.params.article_id;

    if (!articleId) {
        return res.status(400).send({
            message: `Article id is required`
        })
    }

    connection.query(`DELETE FROM article WHERE article_id = ${articleId}`, (error, result) => {
        if (error) throw error;
        res.status(200).send({
            message: 'Success'
        })
    })
})


module.exports = router;