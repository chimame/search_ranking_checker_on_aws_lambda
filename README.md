```bash
$ npm install
$ docker run --rm -v $(pwd):/var/task lambci/lambda:build-nodejs8.10
$ docker run --rm -v $(pwd):/var/task lambci/lambda:nodejs8.10  index.handler '{"searchWord": "hoge+hoge", "siteDomain": "example.com"}'
```
