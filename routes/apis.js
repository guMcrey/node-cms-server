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
            sql += ` article_id = '${article_id}'`;
            count++;
        }
        if (url) {
            sql += count > 0 ? ` AND url LIKE "%${url}%"` : ` url LIKE "%${url}%"`;
            count++;
        }
        if (title) {
            sql += count > 0 ? ` AND title LIKE "%${title}%"` : ` title LIKE "%${title}%"`;
            count++;
        }
        if (startTime && endTime) {
            sql += count > 0 ? ` AND publish_time BETWEEN "${startTime}" AND "${endTime}"` : ` publish_time BETWEEN "${startTime}" AND "${endTime}"`;
            count++;
        }
        if (publishStatus) {
            sql += count > 0 ? ` AND publish_status="${publishStatus}"` : ` publish_status="${publishStatus}"`;
            count++;
        }

        const articles = await query(`${sql} ORDER BY publish_time DESC LIMIT ${params[0]}, ${params[1]}`)
        for (const i of articles) {
            const tags = await query(`SELECT * FROM article_tag WHERE article_id = ${i.article_id}`)
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
 * 接口功能: 获取某条文章详情
 * 参数: article_id
 */
router.get('/articles/:article_id', async (req, res) => {
    let article_info_with_tag = {}
    try {
        const articleId = req.params.article_id;
        if (!articleId) {
            throw new Error('Article not found')
        }
        const articleSql = `SELECT * FROM article WHERE article_id = ${articleId}`
        const tagSql = `SELECT * FROM article_tag WHERE article_id = ${articleId}`
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
    const { title, url, author, content, description, publish_time, publish_status, tag } = req.body;

    if (!title || !articleId) {
        return res.status(400).send({
            message: 'Json Format Error'
        })
    }

    try {
        // 修改 article 信息
        const articleRows = await query(
            `UPDATE article SET title = '${title}', author = '${author}', url = '${url}', publish_time = '${publish_time}', description = '${description}', publish_status = '${publish_status}', content = '${content}' WHERE article_id = '${articleId}'`
        )

        // 查询 tag 是否已创建
        let createTag = []
        for (const i of tag) {
            const isExistTag = await query(`SELECT * FROM tag WHERE tag_name = '${i}'`)
            if (!isExistTag.length) {
                createTag.push(i)
            }
        }

        // 更新 tag 信息
        if (createTag.length) {
            await query(`INSERT INTO tag (tag_name) VALUES ${createTag.map((_) => `("${_}")`)}`)
        }

        // 更新 article_tag 关联信息
        if (tag && tag.length) {
            await query(`REPLACE INTO article_tag (article_id, tag_name) VALUES ${tag.map((_) => `(${articleId}, "${_}")`)}`)
        }

        // 无 tag 时, 删除 tag 与 article 关联信息
        if (!tag.length) {
            await query(`DELETE FROM article_tag WHERE article_id = ${articleId}`)
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
        await query(`DELETE FROM article_tag WHERE article_id = ${articleId}`)

        // 删除 article 数据
        await query(`DELETE FROM article WHERE article_id = ${articleId}`)

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
router.get('/tags', (req, res) => {
    const sql = 'SELECT * FROM tag';
    connection.query(sql, (error, result) => {
        if (error) throw error;
        res.status(200).send({
            result
        })
    })
})


module.exports = router;