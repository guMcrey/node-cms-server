# node-cms-server
Provide api for content management system based on express + mysql

## usage

```bash
$ npm install
$ DEBUG=node-cms-server:* npm start
```

## Preconditions

  Need to install a database, mysql is used here.

  It is recommended to use brew to install

```bash
$ brew install mysql
```

  create table SQL

```bash
mysql> CREATE TABLE IF NOT EXISTS `article` (
  `article_id` INT UNSIGNED AUTO_INCREMENT,
  `title` VARCHAR(300) NOT NULL,
  `author` VARCHAR(50),
  `main_img` VARCHAR(2000),
  `url` VARCHAR(3000),
  `publish_time` VARCHAR(200),
  `tag` VARCHAR(500),
  `description` VARCHAR(2000),
  `publish_status` VARCHAR(200),
  PRIMARY KEY(`article_id`)
  )ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

## features

   * Create article
   * Delete article
   * Update article
   * Select article list

## Frontend project

github: [react-cms-boss](https://github.com/guMcrey/react-cms-boss)


## Tests

  Use postman to test api availability.