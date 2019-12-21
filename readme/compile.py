#!/usr/bin/env python3
"""This script will call latexmk --xelatex to create main.pdf and move it the the parent directory
"""
import subprocess
command='latexmk --xelatex main.tex -silent'
subprocess.run(command.split())
import os
_cwd_=os.getcwd()
if os.path.isfile('main.pdf'):
    command='mv '+os.path.join(_cwd_,'main.pdf')+' '+os.path.join(_cwd_,'..',os.path.basename(_cwd_)+'.pdf')
    subprocess.run(command.split())
command ='latexmk -C'
subprocess.run(command.split())
