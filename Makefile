# kit: the component library and ui.chrisgarlick.com.
GO   ?= go
LINT ?= golangci-lint

.PHONY: kit site serve test lint check clean

kit: ## Build the kit tool
	$(GO) build -o bin/kit ./cmd/kit

site: kit ## Build the site into dist/
	./bin/kit site build -out dist

serve: kit ## Serve the site at http://localhost:8150, rebuilding on every change
	./bin/kit site serve

test:
	$(GO) test ./...

lint:
	$(LINT) run ./...
	GOOS=linux $(LINT) run ./...

check: lint test site ## Everything CI runs

clean:
	rm -rf bin dist
