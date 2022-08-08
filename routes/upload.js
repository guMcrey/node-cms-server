const express = require('express');
const router = express.Router();
const { query, connection } = require('../data/config');
const SqlString = require('sqlstring');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '_' + uniqueSuffix)
    }
})
const uploadConfig = multer({ storage: storage })

/**
 * 接口: 上传图片
 * 字段: main_img
 */
router.put('/article-img/:article_id', uploadConfig.single('main_img'), (req, res) => {
    if (!req.file) {
        res.status(200).send({
            code: 200,
            message: 'img no change'
        })
        return
    }
    const articleId = req.params.article_id;
    localPath = req.file.destination;
    filename = req.file.filename;

    // 插入 main_img 文件路径到 article
    const sql = SqlString.format(`UPDATE article SET main_img = '${filename}' WHERE article_id = ${articleId}`)
    connection.query(sql, (error, result) => {
        if (error) throw error;
        res.status(200).send({
            code: 200,
            filename
        })
    })
})

/**
 * 接口: 上传文章内容图片
 * 字段: wangeditor-uploaded-image
 */

router.post('/article-content-img', uploadConfig.single('wangeditor-uploaded-image'), (req, res) => {
    try {
        if (!req.file) {
            return
        }
        res.status(200).send({
            "errno": 0,
            "data": {
                "url": `http://${req.headers.host}/images/${req.file.filename}`,
                "alt": 'content img',
                "href": `${req.headers.origin}/images/${req.file.filename}`
            }
        })
    } catch (e) {
        res.status(500).send({
            "errno": 1,
            "message": "Upload Filed"
        })
    }

})

/**
 * 接口: 删除文章未上传内容图片
 */
router.patch('/article-content-img', async (req, res) => {
    try {
        const { delete_images } = req.body;
        if (!delete_images || !delete_images.length) {
            res.status(200).send({
                code: 200,
                message: `Affect ${delete_images && delete_images.length} Rows`
            })
            return
        }
        for (const img of delete_images) {
            if (img && img.split('/images/')[1]) {
                const imgPath = `public/images/${img.split('/images/')[1]}`
                await unlinkAsync(imgPath)
            }
        }
        res.status(200).send({
            code: 200,
            message: `Affect ${delete_images && delete_images.length} Rows`
        })
    } catch (e) {
        console.log('e', e)
        res.status(500).send({
            code: 500,
            message: 'Delete Content Images Error'
        })
    }
})

/**
 * 接口: 上传文章内容视频
 * 字段: wangeditor-uploaded-video
 */

router.post('/article-content-video', uploadConfig.single('wangeditor-uploaded-video'), (req, res) => {
    try {
        if (!req.file) {
            return
        }
        res.status(200).send(
            {
                "errno": 0,
                "data": {
                    "url": `http://${req.headers.host}/images/${req.file.filename}`,
                }

            })
    } catch (e) {
        console.log('e', e)
        res.status(500).send(
            {
                "errno": 1,
                "message": "Upload Video Filed"
            }
        )
    }
})

module.exports = router