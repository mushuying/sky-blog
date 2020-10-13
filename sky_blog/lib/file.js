const fs = require('fs');
const path = require('path');
const url = require('url');
const del = require('del');
const gulp = require('gulp');
const log = require('fancy-log');
const mdpack = require('mdpack');
const buildHome = require('./tasks/home');
const buildTag = require('./tasks/tag');
const { connect } = require('http2');
const root = process.cwd();
 async function build() {
  await buildHome()
  await buildTag()
  const metadata = require(path.resolve(root, 'postMap.json'));
  const myInfo = require(path.resolve(root, 'my.json'));
  const htmlMenu = require('./tasks/menu')();
  const rootBuildPath = path.resolve(root, 'build.json');
  // 删除博客文件夹
  del.sync(path.resolve(root, 'blog'));
  if (fs.existsSync(rootBuildPath)) {
    const rootBuildList = require(rootBuildPath).pages;
    rootBuildList.forEach((item) => {
      const mdConfig = {
        entry: path.resolve(root, item.path, item.entry),
        output: {
          path: item.path,
          name: 'index'
        },
        format: ['html'],
        template: path.resolve(root, item.template),
        resources: {
          markdownCss: '/static/css/markdown.css',
          highlightCss: '/static/css/highlight.css',
          homepage: myInfo.homepage,
          name: myInfo.name,
          htmlMenu
        }
      };
      mdpack(mdConfig);
    });
  }

  fs.readdirSync(path.resolve(root, '_posts'))
  .filter(m => fs.statSync(path.resolve(root, '_posts', m)).isDirectory())
  .forEach((year) => {
    fs.readdirSync(path.resolve(root, '_posts', year))
      .forEach((post) => {
        const filename = post.split('.md')[0];
        const _meta = metadata.post.find(_m => _m.filename === filename).metadata;
        const currentUrl = url.resolve(myInfo.homepage, `blog/${year}/${filename}`);
        const mdConfig = {
          entry: path.resolve(root, '_posts', year, post),
          output: {
            path: path.resolve(root, 'blog', year, filename),
            name: 'index'
          },
          format: ['html'],
          plugins: [
            new mdpack.plugins.mdpackPluginRemoveHead()
          ],
          template: path.join(__dirname, 'pages/blog.ejs'),
          resources: {
            markdownCss: '/static/css/markdown.css',
            highlightCss: '/static/css/highlight.css',
            title: _meta.title,
            author: _meta.author,
            type: _meta.type,
            intro: _meta.intro,
            tag: _meta.tag,
            keywords: _meta.keywords,
            homepage: myInfo.homepage,
            name: myInfo.name,
            disqusUrl: myInfo.disqus ? myInfo.disqus.src : false,
            currentUrl,
            htmlMenu
          }
        };
        mdpack(mdConfig);
      });
  });
}
module.exports =build

          