# /accessDocs

Quick access to project documentation

## Usage
```
/accessDocs
```

## Description
Provides quick access to project documentation including project overview, implementation guide, sprint summary, epic specifications, and technical architecture. Also displays current sprint goals and security requirements.

## Implementation
```bash
# Quick access to project documentation
echo "=== PROJECT DOCUMENTATION ==="
echo "1. Project Overview: ../CLAUDE.md"
echo "2. Implementation Guide: ./HowToImplementThisProject.md"
echo "3. Sprint Summary: ../product-owner/ProjectMgmt/SPRINT-1-SUMMARY.md"
echo "4. Epic Specifications: ../product-owner/ProjectMgmt/Milestone 1/"
echo "5. Technical Architecture: ../Milestone1 - Design Specification.md"

echo -e "\n=== QUICK ACCESS ==="
echo "Current sprint goals:"
grep -A 10 "Sprint Goal:" ../product-owner/ProjectMgmt/SPRINT-1-SUMMARY.md

echo -e "\nSecurity requirements:"
grep -A 5 "Security" ../CLAUDE.md
```