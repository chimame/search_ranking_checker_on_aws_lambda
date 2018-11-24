```bash
$ npm install
$ docker run --rm -v $(pwd):/var/task lambci/lambda:build-nodejs8.10

# if getting searchResults
$ docker run --rm -v $(pwd):/var/task lambci/lambda:nodejs8.10  index.handler '{"searchWord": "hoge hoge", "siteDomain": "example.com"}' | jq '.searchResults'

# if getting screenshot
$ docker run --rm -v $(pwd):/var/task lambci/lambda:nodejs8.10  index.handler '{"searchWord": "hoge hoge", "siteDomain": "example.com"}' | jq '.screenShot' | xxd  -r -p > $(pwd)/image.png
```
