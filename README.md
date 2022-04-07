# node-cms-server
Provide api for content management system based on **express + mysql**

## usage

```properties
$ npm install
$ DEBUG=node-cms-server:* npm start

visit http://localhost:3000
```

## Preconditions

  Need to install a database, mysql is used here.

  It is recommended to use brew to install

```properties
$ brew install mysql
```

  create *article* SQL: 

```cmd
mysql> CREATE TABLE IF NOT EXISTS `article` (
  `article_id` INT UNSIGNED AUTO_INCREMENT,
  `title` VARCHAR(300) NOT NULL,
  `author` VARCHAR(50),
  `main_img` VARCHAR(2000),
  `url` VARCHAR(3000),
  `publish_time` VARCHAR(200),
  `description` VARCHAR(2000),
  `publish_status` VARCHAR(200),
  PRIMARY KEY(`article_id`)
  )ENGINE=InnoDB DEFAULT CHARSET=utf8;
```
  
  create *tag* SQL: Tags for articles

```cmd
mysql> CREATE TABLE IF NOT EXISTS `article_tag`(  
  `tag_name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`tag_name`)
  )ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

  create *article_tag* SQL: Tag-to-article association table

```cmd
mysql> CREATE TABLE IF NOT EXISTS `article_tag`(
  `article_id` INT UNSIGNED NOT NULL,
  `tag_name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`article_id`, `tag_name`)
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