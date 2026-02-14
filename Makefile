.PHONY: v1-build v1-test v1-run v2-build v2-test v2-run test-all

v1-build:
	npm run build

v1-test:
	npm run test:integration:nobuild:ci
	npm run test:core:nobuild:ci

v1-run:
	npm run start

v2-build:
	npm run stack:build
	npm run lib:build:ts

v2-test:
	npm run stack:test
	npm run test:integration:lib:ts
	npm run test:e2e:playwright:headless:nobuild

v2-run:
	npm run stack:dev

test-all:
	npm run test:integration:dual-build:verify
	npm run test:all:nobuild
