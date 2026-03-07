// Auto-generated from .elokano source
#include <iostream>
#include <iomanip>
#include <sstream>
#include <string>

std::string elokano_input(const std::string& prompt = "") {
    if (!prompt.empty()) {
        std::cout << prompt;
    }
    std::string line;
    std::getline(std::cin, line);
    return line;
}

std::string elokano_format_double(double value) {
    std::ostringstream oss;
    oss << std::setprecision(15) << std::defaultfloat << value;
    std::string text = oss.str();
    if (text.find('.') == std::string::npos && text.find('e') == std::string::npos && text.find('E') == std::string::npos) {
        text += ".0";
    }
    return text;
}

void elokano_print() {
    std::cout << std::endl;
}

void elokano_print(double value, const std::string& end = "\n") {
    std::cout << elokano_format_double(value) << end;
}

void elokano_print(bool value, const std::string& end = "\n") {
    std::cout << (value ? "True" : "False") << end;
}

template <typename T>
void elokano_print(const T& value, const std::string& end = "\n") {
    std::cout << value << end;
}

int main() {
    std::string ngalan = elokano_input("Nagan mu: ");
    std::string mom = elokano_input("Nagan ni ina mu: ");
    std::string dad = elokano_input("Nagan ni ama mu: ");
    std::string sibling = elokano_input("Nagan ni Ate o Kuya mu: ");
    int x = 10;
    int y = 5;
    double result = (static_cast<double>(((x + y) * 2)) / static_cast<double>(3));
    int quotient = (y / 2);
    int rem = (y % 2);
    elokano_print(((((((("Nagan mo ay " + ngalan) + " anak ni ") + mom) + " at ") + dad) + " kapatid ni ") + sibling), "\n");
    elokano_print("result:\t", "");
    elokano_print(result);
    elokano_print("quotient:\t", "");
    elokano_print(quotient, "\t");
    elokano_print(rem, "\n");
    return 0;
}
