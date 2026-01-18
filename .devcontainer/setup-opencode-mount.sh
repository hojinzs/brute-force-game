#!/bin/bash
# Script to help users mount their OpenCode config
# This can be added to docker-compose.override.yml for optional mounting

cat << 'EOF'
OpenCode 설정 마운트 방법:

1. docker-compose.override.yml 파일을 .devcontainer/ 디렉토리에 생성:

version: '3.8'
services:
  app:
    volumes:
      # OpenCode 설정 마운트 (호스트에 있는 경우)
      - ~/.config/opencode:/home/node/.config/opencode:cached

2. 또는 devcontainer.json의 mounts 섹션에 추가:

"mounts": [
  "source=${localEnv:HOME}/.config/opencode,target=/home/node/.config/opencode,type=bind,consistency=cached"
]

주의: OpenCode 설정 디렉토리가 호스트에 없으면 마운트를 건너뛰어도 됩니다.
EOF
