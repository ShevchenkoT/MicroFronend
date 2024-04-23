## Реалізація мікрофронденду

1. Для початку нам потрібно створити головний проект під назвою `E-tender`. В створеному проекті видалити папку `app` і
   створити папку `projects` в якій будуть міститись головний (`host`) проект, а також `MF` (мікрофрнтенд) проекти,
   а також проект shared в якому будуть міститись модулі, компоненти, директиви, пайпи, сервіси, та Api сервіси які
   можна буде
   викристовувати в головному та MF проектах.

2. Встановлюємо пакет `module-federation` (для коректної роботи потрібно встановити бібліотеку
   версії вашого проекту)

   ```bash
   npm install @angular-architects/module-federation
   ```

3. В папці `projects` створюємо 2 проекти:
    - `host` проект з назвою `main`
    - `MF` з назвою `market`

   (якщо не
   виходить створити в папці, то створюємо проекти ззовні і
   переносимо в папку `projects`). При створенні використовуємо флаг `-g` щоб гіт не ініціалізовувався.

4. За допомогою треміналу заходимо в корінь проекту `main` і виконуємо команду:
   ```bash
   ng g @angular-architects/module-federation:init --project main --port 4200 --type host
   ```
   Так само робимо для `MF` та виконуємо команду :
   ```bash
   ng add @angular-architects/module-federation --project market --port 4201 --type remote
   ```
   Команда робить кілька речей:

    - Створення скелета `webpack.config.js` для об’єднання модулів
    - Встановлення спеціального конструктора, що створює веб-пакет у CLI, використовує створений `webpack.config.js`.
    - Призначення нового порту для `ng serve`, щоб кілька проектів могли обслуговуватися одночасно.

5. Налаштовуємо `market` `MF`. Для початку створюємо модуль який буде основний для даного `MF`, та додаємо його як
   основний
   роут в файлі `app.router.module`

   ```ts
   const routes: Routes = [
    {
      path: '',
      loadChildren: () => import('./modules/market/market.module').then(m => m.MarketModule)
    }
   ];
   ```

   Важливо!!! Імпортуємо `MarketModule` в `app.module.ts` і також додаємо в налаштування `webpack.config.js`:

   ```js
   module.exports = withModuleFederationPlugin({
     name: 'market',

     exposes: {
       './Module': './projects/market/src/app/modules/market/market.module.ts',
     },

     shared: {
      ...shareAll({singleton: true, strictVersion: true, requiredVersion: 'auto'}),
     },
   });
   ```

6. Налаштовуємо основний `main` `remote` проект. Щоб полегшити роботу компілятора `TypeScript`, добавляємо файл
   типізації в папці src з назвою `decl.d.ts`:

   ```ts
   declare module 'market/Module';
   ```

   Додаємо налаштування `webpack.config.js` для змоги виеористовувати `market` `MF`

   ```js
   module.exports = withModuleFederationPlugin({
     remotes: {
       "market": "http://localhost:4201/remoteEntry.js",
     },
   
     shared: {
       ...shareAll({singleton: true, strictVersion: true, requiredVersion: 'auto'}),
     }
   });
   ```

   Та в файл роутингу добавляємо новий роут:
   ```js
   const routes: Routes = [
     {
       path: 'market',
       loadChildren: () => import('market/Module').then(m => m.MarketModule)
     }
   ];
   ```
7. В файлі `angular.json` видаляємо конфігурацію кореневого пректу в полі `projects`. Також добавляємо конфігурації
   головного проекту `main` та (`market`) проекту у вигляді:

   ```json
   [
    {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:application": {
          "strict": true
        }
      },
      "root": "projects/main",
      "sourceRoot": "projects/main/src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "ngx-build-plus:browser",
          "options": {
            "outputPath": "dist/main",
            "index": "projects/main/src/index.html",
            "main": "projects/main/src/main.ts",
            "polyfills": "projects/main/src/polyfills.ts",
            "tsConfig": "projects/main/tsconfig.app.json",
            "assets": [
              "projects/main/src/favicon.ico",
              "projects/main/src/assets"
            ],
            "styles": [
              "projects/main/src/styles.scss"
            ],
            "scripts": [],
            "extraWebpackConfig": "projects/main/webpack.config.js",
            "commonChunk": false
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "1mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kb",
                  "maximumError": "4kb"
                }
              ],
              "fileReplacements": [
                {
                  "replace": "projects/main/src/environments/environment.ts",
                  "with": "projects/main/src/environments/environment.prod.ts"
                }
              ],
              "outputHashing": "all",
              "extraWebpackConfig": "projects/main/webpack.prod.config.js"
            },
            "development": {
              "buildOptimizer": false,
              "optimization": false,
              "vendorChunk": true,
              "extractLicenses": false,
              "sourceMap": true,
              "namedChunks": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "ngx-build-plus:dev-server",
          "configurations": {
            "production": {
              "browserTarget": "main:build:production",
              "extraWebpackConfig": "projects/main/webpack.prod.config.js"
            },
            "development": {
              "browserTarget": "main:build:development"
            }
          },
          "defaultConfiguration": "development",
          "options": {
            "publicHost": "http://localhost:4200",
            "port": 4200,
            "extraWebpackConfig": "projects/main/webpack.config.js"
          }
        },
        "extract-i18n": {
          "builder": "ngx-build-plus:extract-i18n",
          "options": {
            "browserTarget": "main:build",
            "extraWebpackConfig": "projects/main/webpack.config.js"
          }
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "main": "projects/main/src/test.ts",
            "polyfills": "projects/main/src/polyfills.ts",
            "tsConfig": "projects/main/tsconfig.spec.json",
            "karmaConfig": "projects/main/karma.conf.js",
            "assets": [
              "projects/main/src/favicon.ico",
              "projects/main/src/assets"
            ],
            "styles": [
              "projects/main/src/styles.scss"
            ],
            "scripts": []
          }
        }
      }
    }]
   ```

   Встановлюємо бібліотеку для запуску проектів:
   ```bash
   npm i -D ngx-build-plus
   ```
8. В дочірніх проектах можна видалити папки: `node_modules`, `.angular`, а також
   файли: `angular.json`, `.editorconfig`, `.gitignore`,
   `package.json`, `README.md`, `tsconfig.json`.
   В файлах `tsconfig.app.json` і `tsconfig.spec.json`
   замінити `"extends": "./tsconfig.json"` -> `"extends": "../../tsconfig.json"`,
   та  `"outDir": "./out-tsc/app"` => `"outDir": "../../out-tsc/app"` щоб брати `tsconfig` з головного файлу.


9. Для запуску, в кореневому `package.json` файлі додаємо та виконуємо команду:

   ```bash
   "run:all": "node node_modules/@angular-architects/module-federation/src/server/mf-dev-server.js"
   ```
