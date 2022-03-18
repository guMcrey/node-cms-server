const express = require('express');
const router = express.Router();
const connection = require('../data/config');

router.get('/', function (req, res, next) {
    res.send('apis');
});


/** 
 * 接口: 新建文章
 * 字段: title, mainImg, content, url, publishTime, author, tag, description, publishStatus
*/
router.post('/articles', (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).send({
            message: 'Json Format Error'
        })
    }

    connection.query(`INSERT INTO article SET ?`, req.body, (error, result) => {
        if (error) throw error;
        res.status(200).send({
            articleId: result.insertId,
        })
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