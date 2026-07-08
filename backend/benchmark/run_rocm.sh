#!/bin/bash

set -e

echo "======================================="
echo " AMD Port Studio Benchmark Runner"
echo "======================================="

echo ""
echo "Checking Docker..."

docker --version

echo ""
echo "Pulling ROCm image..."

docker pull rocm/pytorch:latest

echo ""
echo "Starting benchmark container..."

docker run \
    --device=/dev/kfd \
    --device=/dev/dri \
    --group-add video \
    --ipc=host \
    --shm-size=8G \
    -v $(pwd):/workspace \
    -w /workspace \
    rocm/pytorch:latest \
    python benchmark.py

echo ""
echo "Benchmark complete."