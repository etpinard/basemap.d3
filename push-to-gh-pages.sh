#! /bin/bash

git checkout gh-pages
git merge master
git add --all
git commit -m "push to gh-pages"
git push
git checkout master
