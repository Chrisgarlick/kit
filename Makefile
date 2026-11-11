# kit: the component library and ui.chrisgarlick.com.
GO   ?= go
LINT ?= golangci-lint

.PHONY: kit site serve sections-php test browser-test lint check clean

kit: ## Build the kit tool
	$(GO) build -o bin/kit ./cmd/kit

site: kit ## Build the site into dist/
	./bin/kit site build -out dist

serve: kit ## Serve the site at http://localhost:8150, rebuilding on every change
	./bin/kit site serve

sections-php: kit ## The sections rendered by plain PHP at http://localhost:8160
	rm -rf tests/php-demo/.out && mkdir -p tests/php-demo/.out
	cp tests/php-demo/index.php tests/php-demo/.out/
	./bin/kit section export -target php -out tests/php-demo/.out/kit header hero footer
	./bin/kit dist -out tests/php-demo/.out/dist -no-js -fonts
	cp -R tests/php-demo/.out/dist/kit.css tests/php-demo/.out/dist/fonts tests/php-demo/.out/
	php -S localhost:8160 -t tests/php-demo/.out

test:
	$(GO) test ./...

browser-test: ## Core, component and site tests in a real browser (npm install first)
	npx playwright test

lint:
	$(LINT) run ./...
	GOOS=linux $(LINT) run ./...

check: lint test site browser-test ## Everything CI runs

clean:
	rm -rf bin dist
