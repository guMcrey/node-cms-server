const express = require('express');
const router = express.Router();
const connection = require('../data/config');

router.get('/', function (req, res, next) {
    res.send('articles');
});


/** 
 * 接口: 新建文章
 * 字段: title, mainImg, content, url, publishTime, author, tag, description, publishStatus
*/
router.post('/create-article', (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).send({
            code: 400,
            message: 'Json Format Error'
        })
    }

    connection.query(`INSERT INTO article SET ?`, req.body, (error, result) => {
        if (error) throw error;
        res.status(200).send({
            code: 200,
            articleId: result.insertId,
            message: 'Success'
        })
    })
});


/**
 * 接口: 获取文章
 * 查询条件: title, publishTime, tag, publishStatus 
 */
router.get('/article-list', (req, res) => {
    const title = req.query.title || '';
    const publishTime = req.query.publishTime || '';
    const tag = req.query.tag || '';
    const publishStatus = req.query.publishStatus || '';

    // TODO: 多条件查询, 分页
    connection.query(`SELECT * FROM article WHERE title like '%${title}%'`, (error, result) => {
        if (error) throw error;
        res.status(200).send({
            code: 200,
            data: {
                result,
                pagination: {
                    pageSize: '',
                    currentPage: '',
                    totalCount: ''
                }
            },
            message: 'Success'
        })
    })
})


/**
 * 接口功能: 修改文章
 * 修改字段: title, mainImg, content, url, publishTime, author, tag, description, publishStatus
 */
router.put('/create-article/:article_id', (req, res) => {
    const articleId = req.params.article_id;
    const { title } = req.body;

    if (!title || !articleId) {
        return res.send({
            code: 400,
            message: 'Json Format Error'
        })
    }

    connection.query(`UPDATE article SET ? WHERE article_id = ?`, [req.body, articleId], (error, result) => {
        if (error) throw error;
        res.status(200).send({
            code: 200,
            articleId: result.changedRows,
            message: 'Success'
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
        return res.send({
            code: 400,
            message: `Article id is required`
        })
    }

    connection.query(`DELETE FROM article WHERE article_id = ${articleId}`, (error, result) => {
        if (error) throw error;
        res.status(200).send({
            code: 200,
            message: 'Success'
        })
    })
})


module.exports = router;