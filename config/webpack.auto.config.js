// 这里解释一下为什么用require调用模块，Webpack配置文件运行在Node.js环境中，
// 而Node.js默认采用CommonJS模块规范（require/exports），
// 而非ES Module规范（import/export）。虽然新版Node.js已支持ES Module，
// 但需显式声明（如package.json中设置"type": "module"）或使用.mjs扩展名

const path = require("path")  // Node.js路径处理模块
const { CleanWebpackPlugin } = require("clean-webpack-plugin")  // 清理构建目录的插件
// const JavascriptObfuscator = require("webpack-obfuscator")
const AutoProWebpackPlugin = require('@auto.pro/webpack-plugin')  // aotopro的webpack自动化构建插件
const ProgressPlugin = require('progress-bar-webpack-plugin')
const Unpack = require('./devUnpack')
const ESLintWebpackPlugin = require('eslint-webpack-plugin')
const DevServer = require('./devServer')
const CopyWebpackPlugin = require('copy-webpack-plugin');

// 字典生成部分：创建二进制字符替换字典（1024-2048的数字转换为ν/v字符串）
const dictionary = []
for (let i = 1024; i < 2048; i++) {
    dictionary.push(
        i
            .toString(2)
            .replace(/1/g, "ν")
            .replace(/0/g, "v")
    )
}

// 根据AutoProWebpackPlugin的匹配规则，
// 若打包的目标文件名为auto.js且插件配置中包含ui:
// ["auto"]，则会在打包后的文件头部自动添加"ui";
const compilePlugin = new AutoProWebpackPlugin({
    ui: ["auto"],
    // entry: {
    //     key: ''
    // }
})

//定义webpack配置
const config = {
    //定义打包入口文件，采用path.resolve是为了方便跨平台使用代码
    entry: {
        app: path.resolve(__dirname, "../src/index.ts"),
    },
    output: {
        filename: "auto.js",
        path: path.resolve(__dirname, "../dist"),

        // 将打包后的代码暴露为全局变量MyLibrary，类型为var
        // 可通过浏览器全局作用域直接访问当其他脚本
        // 通过<script>标签引入auto.js时，可通过window.MyLibrary或直接MyLibrary调用导出内容
        library: {
            name: 'MyLibrary',
            type: 'var',
        },
        // libraryTarget: "commonjs2"  这句代码如生效，则输出为CommonJS模块（需Node.js环境），
    },

    // 明确告知Webpack打包后的代码将在Node.js环境下运行，而非浏览器环境。
    // 这会自动启用Node.js相关全局变量（如process、__dirname）的polyfill，并禁用浏览器专属API的注入。
    target: "node",
    module: {
        rules: [
            {
                // 通过过test: /\.ts$/正则表达式，匹配项目中所有以.ts结尾的TypeScript文
                // test在这里是Webpack规则对象的属性名，其值需要接收一个正则表达式（如/\.ts$/）
                test: /\.ts$/,
                // exclude: /node_modules/, 
                
                //使用ts-loader作为加载器，将TypeScript代码转换为浏览器或Node.js可执行的JavaScript代码
                use: {
                    loader: "ts-loader"
                }
            },
            {
                test: /\.js$/,
                // exclude: /node_modules/,
                use: {

                    // babel-loade将现代JavaScript语法（如箭头函数、class、async/await等）转换为ES5兼容代码，确保在旧版浏览器中正常运行
                    loader: "babel-loader"
                }
            },
            {
                test: /\.(png|svg|jpg|gif)$/,

                // 当文件体积小于设定阈值（通过limit参数配置）时，自动将图片/字体等资源转换为Base64格式的DataURL，
                // 直接嵌入到JS/CSS代码中，减少HTTP请求次数24。例如配置limit: 8192表示8KB以下的文件会被内联
                use: {
                    loader: "url-loader"
                    // options: { limit: 8192 }    //不配置时不转换也不内联表示以上文件格式交由file-loader处理
                }
            }
        ]
    },
    resolve: {

        // 通过extensions: [".js", ".ts", ".json"]配置，当导入模块未指定后缀时，
        // Webpack会按顺序尝试添加.js、.ts、.json后缀进行匹配12。
        // 例如import './utils'会依次查找utils.js、utils.ts、utils.json文件
        extensions: [".js", ".ts", ".json"],
        
        //将@符号映射到项目根目录的src文件夹
        alias: {
            "@": path.resolve(__dirname, "../src")
        }
    }
}


// ESLint对TypeScript文件的代码检查功能
// 通过argv.mode === 'development'判断当前为开发模式时才启用ESLint插件。
// ESLintWebpackPlugin会扫描项目中的.ts文件（通过extensions: ['ts']指定），
// 根据项目配置的ESLint规则进行静态代码分析，实时反馈语法错误、风格问题等‌12。
// fix: true选项若启用，会自动修复部分可修复的规则违规（如缩进、引号等），但可能影响开发体验，需谨慎使用‌
module.exports = (env, argv) => {
    if (argv.mode === 'development') {
        config.plugins = [
            new ESLintWebpackPlugin({
                extensions: ['ts'],
                // fix: true, // 自动修复

            }),
            new CleanWebpackPlugin({
                cleanOnceBeforeBuildPatterns: [__dirname + '/../dist/auto.js']
            }),
            compilePlugin,
            new ProgressPlugin(),
            new CopyWebpackPlugin({
                patterns: [
                    { from: path.resolve(__dirname, '../node_modules/assttyys_ui/dist/index.html'), to: '.' },
                ]
            }),
            new Unpack(),
            new DevServer(),
        ]
        // config.devtool = 'source-map'
    } else {
        config.plugins = [
            new ESLintWebpackPlugin({
                extensions: ['ts'],
            }),
            new CleanWebpackPlugin({
                cleanOnceBeforeBuildPatterns: [__dirname + '/../dist/auto.js'],
            }),
            // new JavascriptObfuscator({
            //     compact: true,
            //     identifierNamesGenerator: "dictionary",
            //     identifiersDictionary: dictionary,
            //     target: "node",
            //     transformObjectKeys: false,
            //     stringArray: true,
            //     stringArrayEncoding: ['rc4'],
            // }),
            compilePlugin,
            new ProgressPlugin(),

            // CopyWebpackPlugin插件实现了一个文件复制功能
            new CopyWebpackPlugin({
                patterns: [
                    { from: path.resolve(__dirname, '../node_modules/assttyys_ui/dist/index.html'), to: '.' },
                ]
            }),
        ]
    }

    return config
}
