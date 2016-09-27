from setuptools import setup, find_packages
setup(
    name="superdesk-planning",
    version="0.1",
    package_dir={'': 'server'},
    packages=find_packages('server'),
    author='Edouard Richard',
    author_email='edouard.richard@sourcefabric.org',
    license='MIT',
    url='',
)
