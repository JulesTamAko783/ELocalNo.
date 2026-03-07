// Auto-generated from .elokano source
#include <iostream>
#include <string>

std::string elokano_input(const std::string& prompt = "") {
    if (!prompt.empty()) {
        std::cout << prompt;
    }
    std::string line;
    std::getline(std::cin, line);
    return line;
}

int main() {
    std::string ngalan = elokano_input("Nagan mu: ");
    std::string mom = elokano_input("Nagan ni ina mu: ");
    std::string dad = elokano_input("Nagan ni ama mu: ");
    std::string sibling = elokano_input("Nagan ni Ate o Kuya mu: ");
    int x = 10;
    int y = 5;
    double result = (((x + y) * 2) / 3);
    std::cout << ((((((("Nagan mo ay " + ngalan) + " anak ni ") + mom) + " at ") + dad) + " kapatid ni ") + sibling) << std::endl;
    std::cout << result << std::endl;
    return 0;
}
