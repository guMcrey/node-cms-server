const express = require('express');
const router = express.Router();
const { query, connection } = require('../data/config');
const SqlString = require('sqlstring');

router.get('/', function (req, res, next) {
    res.send('apis');
});


/** 
 * 接口: 新建文章
 * 字段: title, main_img, content, url, publish_time, author, tag, description, publish_status
*/
router.post('/articles', async (req, res) => {
    let { title, url, author, content, description, publish_time, publish_status, tag } = req.body
    let articleId = undefined;

    if (!title) {
        return res.status(400).send({
            message: 'Json Format Error'
        })
    }

    try {
        // 插入 article 信息
        const insertSql = SqlString.format(`INSERT INTO article SET ?`, { title, url, author, content, description, publish_time, publish_status })
        const articleRows = await query(insertSql)
        articleId = articleRows.insertId

        // 查询 tag 并过滤
        let createTag = []
        for (const i of tag) {
            const selectSql = SqlString.format(`SELECT * FROM tag WHERE tag_name = ?`, i)
            const isExistTag = await query(selectSql)
            if (!isExistTag.length) {
                createTag.push(i)
            }
        }

        // 插入 tag 信息
        if (createTag.length) {
            const insertTagSql = `INSERT INTO tag (tag_name) VALUES ${createTag.map((_) => `(${SqlString.escape(`${_}`)})`)}`
            await query(insertTagSql)
            // 插入 article_tag 关联信息
            const insertArticleTagSql = `INSERT INTO article_tag (article_id, tag_name) VALUES ${tag.map((_) => `(${articleId}, ${SqlString.escape(`${_}`)})`)}`
            await query(insertArticleTagSql)
        }

    } catch (e) {
        console.log('e', e)
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
 * 查询条件: article_id, url, title, publishTime, tag, publishStatus 
 * 参数: curPage, pageSize
 */
router.get('/articles', async (req, res) => {
    const article_id = req.query.article_id || '';
    const url = req.query.url || '';
    const title = req.query.title || '';
    const startTime = req.query.publish_time_start || '';
    const endTime = req.query.publish_time_end || '';
    const tag = req.query.tag || '';
    const publishStatus = req.query.publish_status || '';

    const curPage = req.query.curPage ? parseInt(req.query.curPage) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 15;
    const params = [(curPage - 1) * pageSize, pageSize];
    let count = 0
    let article_tag_list = []
    let sql = 'SELECT * FROM article'

    try {
        if (article_id || url || title || (startTime && endTime) || publishStatus) {
            sql += ' WHERE'
        }
        if (article_id) {
            sql += ` article_id = ${SqlString.escape(article_id)}`;
            count++;
        }
        if (url) {
            sql += count > 0 ? ` AND url LIKE` + SqlString.escape(`%${url}%`) : ` url LIKE ${SqlString.escape(`%${url}%`)}`;
            count++;
        }
        if (title) {
            sql += count > 0 ? ` AND title LIKE ${SqlString.escape(`%${title}%`)}` : ` title LIKE ${SqlString.escape(`%${title}%`)}`;
            count++;
        }
        if (startTime && endTime) {
            sql += count > 0 ? ` AND publish_time BETWEEN ${SqlString.escape(startTime)} AND ${SqlString.escape(endTime)}` : ` publish_time BETWEEN ${SqlString.escape(startTime)} AND ${SqlString.escape(endTime)}`;
            count++;
        }
        if (publishStatus) {
            sql += count > 0 ? ` AND publish_status=${SqlString.escape(publishStatus)}` : ` publish_status=${SqlString.escape(publishStatus)}`;
            count++;
        }

        const articles = await query(`${sql} ORDER BY publish_time DESC limit ?, ?`, params)
        for (const i of articles) {
            const tags = await query(`SELECT * FROM article_tag WHERE article_id = ${SqlString.escape(i.article_id)}`)
            article_tag_list.push({
                ...i,
                tag: tags.map((_) => _.tag_name)
            })

            if (tag) {
                article_tag_list = article_tag_list.filter((val) => {
                    const temp = val.tag.filter((_) => tag.split(',').includes(_))
                    return temp.length
                })
            }
        }
    } catch (e) {
        res.status(500).send({
            message: 'Get Articles Error'
        })
    }

    res.status(200).send({
        result: article_tag_list,
        pagination: {
            pageSize,
            curPage,
            total: res.length,
        },
    })
})

/**
 * 接口: 获取文章分页
 * 查询条件: 
 * 参数: page_num, page_size
 */
router.get('/articles/page', async (req, res) => {
    const pageNum = req.query.page_num || 1;
    const pageSize = req.query.page_size || 3;
    const params = [(parseInt(pageNum) - 1) * parseInt(pageSize), parseInt(pageSize)];
    var sql = SqlString.format('select * from article limit ?, ?', params);
    var sqlToTotal = SqlString.format('select count(*) as total from article');
    let articleList = [];
    let total = 0;
    try {
        articleList = await query(sql);
        const totalNumber = await query(sqlToTotal);
        total = totalNumber[0].total;
    } catch (e) {
        res.status(500).send({
            message: 'Get Articles Error'
        })
    }

    res.status(200).send({
        result: articleList,
        page: {
            pageSize: parseInt(pageSize),
            pageNum: parseInt(pageNum),
            total,
        }
    })
})

/**
 * 接口功能: 获取某条文章详情
 * 参数: article_id
 */
router.get('/articles/:article_id', async (req, res) => {
    let article_info_with_tag = {}
    try {
        const articleId = req.params.article_id;
        if (!articleId) {
            res.status(500).send({
                message: 'Article not found'
            })
            return
        }
        const articleSql = `SELECT * FROM article WHERE article_id = ${SqlString.escape(articleId)}`
        const tagSql = `SELECT * FROM article_tag WHERE article_id = ${SqlString.escape(articleId)}`
        const articleInfo = await query(articleSql)
        if (!articleInfo.length) {
            throw new Error('Article not found')
        }
        const tags = await query(tagSql)

        article_info_with_tag = {
            ...articleInfo[0],
            tag: tags.map((_) => _.tag_name)
        }
    } catch (e) {
        res.status(500).send({
            message: 'Get Articles Error'
        })
    }

    res.status(200).send({
        result: article_info_with_tag
    })
})


/**
 * 接口功能: 修改文章
 * 修改字段: title, mainImg, content, url, publishTime, author, tag, description, publishStatus
 */
router.put('/articles/:article_id', async (req, res) => {
    const articleId = req.params.article_id;
    let { title, url, author, content, description, publish_time, publish_status, tag } = req.body;

    if (!title || !articleId) {
        return res.status(400).send({
            message: 'Json Format Error'
        })
    }

    try {
        // 修改 article 信息
        const updateSql = SqlString.format(`UPDATE article SET ? WHERE article_id = ?`,
            [{ title, author, url, publish_time, description, publish_status, content }, articleId])
        await query(updateSql)

        // 查询 tag 是否已创建
        let createTag = []
        for (const i of tag) {
            const tagSql = SqlString.format(`SELECT * FROM tag WHERE tag_name = ?`, i)
            const isExistTag = await query(tagSql)
            if (!isExistTag.length) {
                createTag.push(i)
            }
        }

        // 更新 tag 信息
        if (createTag.length) {
            await query(`INSERT INTO tag (tag_name) VALUES ${createTag.map((_) => `(${SqlString.escape(_)})`)}`)
        }

        // 更新 article_tag 关联信息
        if (tag && tag.length) {
            await query(`REPLACE INTO article_tag (article_id, tag_name) VALUES ${tag.map((_) => `(${articleId}, ${SqlString.escape(_)})`)}`)
        }

        // 无 tag 时, 删除 tag 与 article 关联信息
        if (!tag.length) {
            await query(`DELETE FROM article_tag WHERE article_id = ${SqlString.escape(articleId)}`)
        }

    } catch (e) {
        console.log('e', e)
        res.status(500).send({
            message: 'Update Error'
        })
    }

    res.status(200).send({
        articleId,
        message: 'Success'
    })
})


/**
 * 接口功能: 删除某篇文章
 * 必要字段: articleId
 */
router.delete('/articles/:article_id', async (req, res) => {
    try {
        const articleId = req.params.article_id;
        if (!articleId) {
            return res.status(400).send({
                message: `Article id is required`
            })
        }

        // 删除 article_tag 数据
        await query(`DELETE FROM article_tag WHERE article_id = ${SqlString.escape(articleId)}`)

        // 删除 article 数据
        await query(`DELETE FROM article WHERE article_id = ${SqlString.escape(articleId)}`)

        res.status(200).send({
            message: 'Success'
        })
    } catch (e) {
        res.status(500).send({
            message: 'Delete Error'
        })
    }
})

/**
 * 接口: 获取 tag 列表
 */
router.get('/tags/page', async (req, res) => {
    const pageNumber = req.query.page_number || 1;
    const pageSize = req.query.page_size || 3;
    const params = [(parseInt(pageNumber) - 1) * parseInt(pageSize), parseInt(pageSize)]
    const sql = SqlString.format('SELECT * FROM tag LIMIT ?, ?', params);
    const sqlTotal = SqlString.format('SELECT COUNT(*) AS total FROM tag');
    let tagList = [];
    let total = 0;
    try {
        tagList = await query(sql);
        const totalNumber = await query(sqlTotal)
        total = totalNumber[0].total

        res.status(200).send({
            result: tagList,
            page: {
                pageNumber: parseInt(pageNumber),
                pageSize: parseInt(pageSize),
                total
            }
        })
    } catch (e) {
        res.status(500).send({
            message: 'Get tags error'
        })
    }
})


module.exports = router;