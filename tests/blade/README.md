# Blade parity

`go test ./internal/sections` renders every section's demos three ways: kit's
Go renderer, the compiled PHP and, when this folder's packages are installed,
real Blade (illuminate/view on its own, no Laravel app). All three must match
byte for byte.

```
cd tests/blade && composer install
```

Without `vendor/` the Blade comparison is skipped; without `php` the PHP one is.
