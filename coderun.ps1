param(
    [string]$Source = "test.elokano",
    [string]$Out = "generated_target.cpp",
    [string]$Exe = "generated_target.exe"
)

python coderun.py $Source --out $Out --exe $Exe
