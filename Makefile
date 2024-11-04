install_cli:
	./setup/bash/install_cli.sh

sebastian-docker-run:
	./setup/bash/run-compose.sh ./docker-compose.yaml -d

sebastian-docker-dev:
	./setup/bash/run-compose.sh ./docker-compose.yaml --watch

hocuspocus-docker-run:
	./setup/bash/run-compose.sh ./hocuspocus/docker-compose.yaml --no-network -d

hocuspocus-dev:
	make -C ./hocuspocus run-dev

server-docker-run:
	./setup/bash/run-compose.sh ./server/docker-compose.yaml --no-network -d

server-dev:
	make -C ./server run-dev

setup-docker-run:
	./setup/bash/run-compose.sh ./setup/docker-compose.yaml --no-network -d


