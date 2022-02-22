/**
 * 功能: 连接 mysql 数据库
 * 无法连接参考: https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server
 * 拓展: mysql.createConnection 和 mysql.createPool 的区别
 *   -- 当创建一个连接时, 只有一个连接且会一直持续到被关闭, 可以通过引用传递对它重用, 也可以根据需要创建和关闭连接
 *   -- 池是存储连接的地方, 当从池中请求连接时, 将会收到一个当前未被使用的连接, 或者一个新的连接. 如果已经达到了连接限制,
 *      则它将等待连接可用后再继续, 这些池连接不需要手动关闭, 它们可以保持打开状态, 并易于重用.
 */
const mysql = require('mysql');

const config = {
    host: 'localhost',
    user: 'root',
    password: 'Password123#@!',
    database: 'new_db_name',
};

const connection = mysql.createPool(config);
console.log('connected!')

module.exports = connection;

