param(
    [string]$Source = "test.elokano",
    [string]$Out = "generated_target.py"
)

python coderun.py $Source --out $Out
