const express = require('express');
const router = express.Router();
const { query, connection } = require('../data/config');
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
    const sql = `UPDATE article SET main_img = '${filename}' WHERE article_id = ${articleId}`
    connection.query(sql, (error, result) => {
        if (error) throw error;
        res.status(200).send({
            code: 200,
            filename
        })
    })
})

module.exports = router