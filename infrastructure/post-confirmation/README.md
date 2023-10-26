dummy - just zip version
zip -r deploy_code_exchange_lambda.zip .

esbuild - faster 

npm install --save-exact --save-dev esbuild
./node_modules/.bin/esbuild --version
./node_modules/.bin/esbuild ./src/handler.ts  --bundle --outfile=out.js

