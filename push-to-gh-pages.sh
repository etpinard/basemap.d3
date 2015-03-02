#! /bin/bash

git checkout gd-pages
git merge master
git add --all
git commit -m "push to gh-pages"
git checkout master
